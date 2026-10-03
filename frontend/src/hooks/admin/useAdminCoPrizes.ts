'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';

export interface CoPrizeItem {
  id: number;
  ticket_serial: string;
  user_id: number;
  user: {
    id: number;
    email: string;
    display_name: string | null;
  } | null;
  amount_cents: number;
  amount_usd: number;
  status: 'pending' | 'available' | 'cleared' | 'cancelled';
  funding_source: string;
  created_at: string;
  approval_provenance: {
    is_fully_approved: boolean;
    kyc: {
      status: string;
      approval_id: string | null;
      is_approved: boolean;
      version?: number;
      revoked_at?: string | null;
    };
    draw_integrity: {
      status: string;
      approval_id: string | null;
      is_approved: boolean;
      version?: number;
      revoked_at?: string | null;
    };
    draw_winner_exists: boolean;
  } | null;
  revocation_preview: {
    reversal_amount_cents: number;
    current_available_cents: number;
    post_reversal_available_cents: number;
    uncovered_exposure_cents: number;
    is_fully_covered: boolean;
  } | null;
}

export function useAdminCoPrizes(status?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<{ items: CoPrizeItem[]; next_cursor: string | null }, ApiError>({
    queryKey: ['admin', 'coprizes', status],
    queryFn: () => {
      const params = new URLSearchParams({ per_page: '25' });
      if (status && status !== 'all') {
        params.append('status', status);
      }
      return apiClient<{ items: CoPrizeItem[]; next_cursor: string | null }>(
        `/admin/coprizes?${params.toString()}`
      );
    },
    staleTime: 15 * 1000,
  });

  const releaseMutation = useMutation<any, ApiError, string>({
    mutationFn: (serial) =>
      apiClient<any>(`/admin/coprizes/${serial}/release`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coprizes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] });
    },
  });

  const revokeMutation = useMutation<any, ApiError, { serial: string; justification: string }>({
    mutationFn: ({ serial, justification }) =>
      apiClient<any>(`/admin/coprizes/${serial}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ justification }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coprizes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] });
    },
  });

  return {
    coprizes: query.data?.items ?? [],
    nextCursor: query.data?.next_cursor ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    releaseCoPrize: releaseMutation.mutateAsync,
    isReleasing: releaseMutation.isPending,
    revokeCoPrize: revokeMutation.mutateAsync,
    isRevoking: revokeMutation.isPending,
  };
}
