'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ActiveDrawsData, ConcludedDrawsData, DrawItem, ConcludedDrawItem } from '@/types/draws';
import { MOCK_ACTIVE_DRAWS, MOCK_CONCLUDED_DRAWS, getMockServerTimeUtc } from '@/data/mock-draws';

export function useActiveDraws(initialData?: ActiveDrawsData) {
  const query = useQuery<ActiveDrawsData>({
    queryKey: ['draws', 'active'],
    queryFn: async () => {
      try {
        const result = await apiClient<ActiveDrawsData>('/draws/active');
        if (result && Array.isArray(result.draws)) {
          return result;
        }
        return {
          server_time_utc: getMockServerTimeUtc(),
          draws: MOCK_ACTIVE_DRAWS,
        };
      } catch (err) {
        console.warn('Backend active draws endpoint unreachable, using offline fallback', err);
        return {
          server_time_utc: getMockServerTimeUtc(),
          draws: MOCK_ACTIVE_DRAWS,
        };
      }
    },
    initialData: initialData ?? {
      server_time_utc: getMockServerTimeUtc(),
      draws: MOCK_ACTIVE_DRAWS,
    },
    staleTime: 30 * 1000, // 30s caching
    refetchInterval: 60 * 1000,
  });

  const serverTimeUtc = query.data?.server_time_utc ?? getMockServerTimeUtc();
  const draws = query.data?.draws ?? MOCK_ACTIVE_DRAWS;

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
        return { draws: MOCK_CONCLUDED_DRAWS };
      } catch (err) {
        console.warn('Backend concluded draws endpoint unreachable, using offline fallback', err);
        return { draws: MOCK_CONCLUDED_DRAWS };
      }
    },
    initialData: initialData ?? { draws: MOCK_CONCLUDED_DRAWS },
    staleTime: 2 * 60 * 1000,
  });

  const draws = query.data?.draws ?? MOCK_CONCLUDED_DRAWS;

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
  const grandDraw = draws.find((d) => d.tier === 'monthly') ?? draws[0] ?? null;

  return {
    grandDraw,
    serverTimeUtc,
    isLoading,
  };
}
