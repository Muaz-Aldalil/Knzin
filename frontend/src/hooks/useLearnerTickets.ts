'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';

export interface TicketEligibilityTier {
  is_eligible: boolean;
  status: 'active' | 'concluded' | 'locked';
}

export interface TicketItem {
  id: string;
  serial_number: string;
  issued_at: string;
  originating_order_number: string;
  eligibility: {
    hourly: TicketEligibilityTier;
    daily: TicketEligibilityTier;
    monthly: TicketEligibilityTier;
  };
}

export interface ActiveDrawMeta {
  id: string;
  title_ar: string;
  title_en: string;
  ends_at: string | null;
  status: string;
}

export interface LearnerTicketsData {
  total_tickets: number;
  server_time_utc: string;
  active_draws: {
    hourly?: ActiveDrawMeta;
    daily?: ActiveDrawMeta;
    monthly?: ActiveDrawMeta;
  };
  tickets: TicketItem[];
}

export function useLearnerTickets() {
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('knzin_auth_token') : false;
  const lastRequestTimestampRef = useRef<number>(0);

  const [clockSkewMs, setClockSkewMs] = useState<number>(0);
  const [syncedCurrentTimeMs, setSyncedCurrentTimeMs] = useState<number>(Date.now());

  const query = useQuery<LearnerTicketsData, ApiError>({
    queryKey: ['learner', 'tickets'],
    queryFn: async () => {
      const requestStart = Date.now();
      lastRequestTimestampRef.current = requestStart;

      const data = await apiClient<LearnerTicketsData>('/user/tickets');

      // Discard stale out-of-order responses
      if (requestStart < lastRequestTimestampRef.current) {
        return data;
      }

      if (data.server_time_utc) {
        const serverMs = new Date(data.server_time_utc).getTime();
        const clientNow = Date.now();
        const roundTripEstimate = (clientNow - requestStart) / 2;
        const computedSkew = serverMs - (clientNow - roundTripEstimate);
        setClockSkewMs(computedSkew);
        setSyncedCurrentTimeMs(clientNow + computedSkew);
      }

      return data;
    },
    enabled: hasToken,
    staleTime: 15 * 1000,
    refetchInterval: 60 * 1000,
  });

  // Synchronized countdown ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncedCurrentTimeMs(Date.now() + clockSkewMs);
    }, 1000);

    return () => clearInterval(interval);
  }, [clockSkewMs]);

  const getTimeRemainingMs = useCallback(
    (targetDateIso: string | null | undefined): number => {
      if (!targetDateIso) return 0;
      const targetMs = new Date(targetDateIso).getTime();
      return Math.max(0, targetMs - syncedCurrentTimeMs);
    },
    [syncedCurrentTimeMs]
  );

  return {
    ticketsData: query.data ?? null,
    totalTickets: query.data?.total_tickets ?? 0,
    activeDraws: query.data?.active_draws ?? {},
    tickets: query.data?.tickets ?? [],
    isEmpty: query.isSuccess && (!query.data?.tickets || query.data.tickets.length === 0),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    clockSkewMs,
    syncedCurrentTimeMs,
    getTimeRemainingMs,
    refetch: query.refetch,
  };
}
