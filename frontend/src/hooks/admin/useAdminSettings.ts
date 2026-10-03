'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';

export interface AdminSettingsData {
  commission_rate_bps: number;
  commission_rate_percent: number;
  payout_min_cents: number;
  maturation_hours: number;
  co_prize_rate_bps: number;
  meta: Record<string, { updated_by_user_id: number | null; updated_at: string | null }>;
}

export interface UpdateSettingsPayload {
  commission_rate_bps?: number;
  payout_min_cents?: number;
}

export function useAdminSettings() {
  const queryClient = useQueryClient();

  const query = useQuery<AdminSettingsData, ApiError>({
    queryKey: ['admin', 'settings'],
    queryFn: () => apiClient<AdminSettingsData>('/admin/settings'),
    staleTime: 10 * 1000,
  });

  const mutation = useMutation<AdminSettingsData, ApiError, UpdateSettingsPayload>({
    mutationFn: (payload) =>
      apiClient<AdminSettingsData>('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'settings'], data);
      queryClient.invalidateQueries({ queryKey: ['affiliate', 'policy'] });
    },
  });

  return {
    settings: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updateSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
    refetch: query.refetch,
  };
}
