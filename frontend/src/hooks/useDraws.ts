'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ActiveDrawsData, ConcludedDrawsData, DrawItem, ConcludedDrawItem } from '@/types/draws';
import { MOCK_ACTIVE_DRAWS, MOCK_CONCLUDED_DRAWS, getMockServerTimeUtc } from '@/data/mock-draws';

const isDev = process.env.NODE_ENV !== 'production';

export function useActiveDraws(initialData?: ActiveDrawsData) {
  const query = useQuery<ActiveDrawsData>({
    queryKey: ['draws', 'active'],
    queryFn: async () => {
      try {
        const result = await apiClient<ActiveDrawsData>('/draws/active');
        if (result && Array.isArray(result.draws)) {
          return result;
        }
        return isDev
          ? { server_time_utc: getMockServerTimeUtc(), draws: MOCK_ACTIVE_DRAWS }
          : { server_time_utc: new Date().toISOString(), draws: [] };
      } catch (err) {
        if (isDev) {
          console.warn('Backend active draws endpoint unreachable, using offline fallback in development', err);
          return {
            server_time_utc: getMockServerTimeUtc(),
            draws: MOCK_ACTIVE_DRAWS,
          };
        }
        throw err;
      }
    },
    initialData: initialData ?? (isDev ? { server_time_utc: getMockServerTimeUtc(), draws: MOCK_ACTIVE_DRAWS } : undefined),
    staleTime: 30 * 1000, // 30s caching
    refetchInterval: 60 * 1000,
  });

  const serverTimeUtc = query.data?.server_time_utc ?? (isDev ? getMockServerTimeUtc() : new Date().toISOString());
  const draws = query.data?.draws ?? [];

  return {
    draws,
    serverTimeUtc,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useConcludedDraws(initialData?: ConcludedDrawsData) {
  const query = useQuery<ConcludedDrawsData>({
    queryKey: ['draws', 'concluded'],
    queryFn: async () => {
      try {
        const result = await apiClient<ConcludedDrawsData>('/draws/concluded');
        if (result && Array.isArray(result.draws)) {
          return result;
        }
        return isDev ? { draws: MOCK_CONCLUDED_DRAWS } : { draws: [] };
      } catch (err) {
        if (isDev) {
          console.warn('Backend concluded draws endpoint unreachable, using offline fallback in development', err);
          return { draws: MOCK_CONCLUDED_DRAWS };
        }
        throw err;
      }
    },
    initialData: initialData ?? (isDev ? { draws: MOCK_CONCLUDED_DRAWS } : undefined),
    staleTime: 2 * 60 * 1000,
  });

  const draws = query.data?.draws ?? [];

  return {
    draws,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useGrandPrizeDraw() {
  const { draws, serverTimeUtc, isLoading } = useActiveDraws();
  const grandDraw =
    draws.find((d) => d.tier === 'monthly' && Boolean(d.prize)) ??
    draws.find((d) => Boolean(d.prize)) ??
    null;

  return {
    grandDraw,
    serverTimeUtc,
    isLoading,
  };
}
