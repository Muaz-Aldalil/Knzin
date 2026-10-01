'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';

export interface PlaybackStreamData {
  stream_url: string;
  format: string;
  expires_at: string | null;
  validity_seconds: number | null;
}

export interface WatermarkData {
  account_email: string;
  learner_code: string;
  rendered_at: string;
}

export interface PaywallPricing {
  part_price_cents: number;
  part_promotional_tickets: number;
  bundle_price_cents: number;
  bundle_promotional_tickets: number;
}

export interface PlaybackAuthResponse {
  course_slug: string;
  part_number: number;
  part_title_ar: string;
  part_title_en: string;
  duration_seconds: number;
  stream: PlaybackStreamData;
  watermark: WatermarkData | null;
}

export function useLessonPlayback(courseSlug: string, partNumber: number) {
  const [authData, setAuthData] = useState<PlaybackAuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [pricing, setPricing] = useState<PaywallPricing | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPlaybackAuth = useCallback(async () => {
    if (!courseSlug || !partNumber) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient<PlaybackAuthResponse>(
        `/lessons/${courseSlug}/parts/${partNumber}/playback-auth`,
        {
          method: 'POST',
        }
      );

      setAuthData(data);
      setIsLocked(false);
      setPricing(null);

      // Schedule token refresh at 14 minutes (840 seconds) if token has expiration
      if (data.stream?.validity_seconds && data.stream.validity_seconds > 60) {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        const refreshTimeMs = (data.stream.validity_seconds - 60) * 1000;
        refreshTimeoutRef.current = setTimeout(() => {
          fetchPlaybackAuth();
        }, refreshTimeMs);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err);
        if (err.code === 'ERR_PART_LOCKED') {
          setIsLocked(true);
          const paywallPricing = err.data?.pricing || (err as any).pricing;
          if (paywallPricing) {
            setPricing(paywallPricing);
          }
        }
      } else {
        setError(new ApiError('Failed to authorize lesson playback', 'ERR_PLAYBACK_AUTH', 500));
      }
    } finally {
      setIsLoading(false);
    }
  }, [courseSlug, partNumber]);

  useEffect(() => {
    fetchPlaybackAuth();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [fetchPlaybackAuth]);

  return {
    authData,
    streamUrl: authData?.stream?.stream_url ?? null,
    watermark: authData?.watermark ?? null,
    durationSeconds: authData?.duration_seconds ?? 0,
    isLocked,
    pricing,
    isLoading,
    isError: !!error,
    error,
    refreshAuth: fetchPlaybackAuth,
  };
}
