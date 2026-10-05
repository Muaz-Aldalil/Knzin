'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';
import { AdminSession, AdminCapability } from '@/types/admin';
import { hasCapability } from '@/lib/admin/capabilities';
import { extendAdminSession } from '@/lib/admin/access';

export const WARNING_THRESHOLD_SECONDS = 60; // 1 minute warning
export const ADMIN_SESSION_EXTENDED_KEY = 'knzin_admin_session_extended_at';

export function useAdminSession() {
  const queryClient = useQueryClient();
  const token = typeof window !== 'undefined' ? localStorage.getItem('knzin_auth_token') : null;
  const hasToken = !!token;

  const query = useQuery<AdminSession, ApiError>({
    queryKey: ['admin', 'session', token],
    queryFn: () => apiClient<AdminSession>('/admin/me'),
    enabled: hasToken,
    staleTime: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  const session = query.data ?? null;
  const capabilities = session?.capabilities ?? [];
  const isAuthenticated = hasToken && !query.isError && !!session;
  const isUnauthenticated = !hasToken || (query.error instanceof ApiError && query.error.httpStatus === 401);
  const isForbidden = query.error instanceof ApiError && query.error.httpStatus === 403;

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // Sync remaining seconds whenever fresh session telemetry arrives
  useEffect(() => {
    if (session?.session?.remaining_seconds !== undefined) {
      setRemainingSeconds(session.session.remaining_seconds);
    }
  }, [session?.session?.remaining_seconds]);

  // Live tick-down timer every second
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  // Multi-tab synchronization via localStorage storage event
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_SESSION_EXTENDED_KEY) {
        query.refetch();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [query]);

  const extendMutation = useMutation({
    mutationFn: extendAdminSession,
    onSuccess: (newSession) => {
      queryClient.setQueryData(['admin', 'session', token], newSession);
      if (newSession?.session?.remaining_seconds) {
        setRemainingSeconds(newSession.session.remaining_seconds);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_SESSION_EXTENDED_KEY, Date.now().toString());
      }
    },
  });

  const extendSession = useCallback(async () => {
    return await extendMutation.mutateAsync();
  }, [extendMutation]);

  const can = (required: AdminCapability | AdminCapability[]) => {
    return hasCapability(capabilities, required);
  };

  const isWarning =
    remainingSeconds !== null &&
    remainingSeconds <= WARNING_THRESHOLD_SECONDS &&
    remainingSeconds > 0;

  const isExpired = remainingSeconds !== null && remainingSeconds <= 0;

  return {
    session,
    user: session?.user ?? null,
    capabilities,
    sessionTelemetry: session?.session ?? null,
    serverTimeUtc: session?.server_time_utc ?? null,
    remainingSeconds,
    isWarning,
    isExpired,
    extendSession,
    isExtending: extendMutation.isPending,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isAuthenticated,
    isUnauthenticated,
    isForbidden,
    can,
    refetch: query.refetch,
  };
}
