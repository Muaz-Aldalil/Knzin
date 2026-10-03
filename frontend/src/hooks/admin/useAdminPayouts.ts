'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';
import { PayoutRecord } from '@/types/admin';

export interface AdminPayoutsResponse {
  items: PayoutRecord[];
  next_cursor: string | null;
}

export interface SettlePayoutPayload {
  payoutNumber: string;
  referenceNumber: string;
  receiptFile: File;
  notes?: string;
}

export interface RejectPayoutPayload {
  payoutNumber: string;
  reason: string;
}

export function useAdminPayouts(status?: string, cursor?: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery<AdminPayoutsResponse, ApiError>({
    queryKey: ['admin', 'payouts', status, cursor],
    queryFn: () => {
      const params = new URLSearchParams({ per_page: '25' });
      if (status && status !== 'all') {
        params.append('status', status);
      }
      if (cursor) {
        params.append('cursor', cursor);
      }
      return apiClient<AdminPayoutsResponse>(`/admin/payouts?${params.toString()}`);
    },
    staleTime: 15 * 1000,
  });

  const settleMutation = useMutation<PayoutRecord, ApiError, SettlePayoutPayload>({
    mutationFn: ({ payoutNumber, referenceNumber, receiptFile, notes }) => {
      const formData = new FormData();
      formData.append('reference_number', referenceNumber);
      formData.append('receipt', receiptFile);
      if (notes) {
        formData.append('notes', notes);
      }

      return apiClient<PayoutRecord>(`/admin/payouts/${payoutNumber}/settle`, {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] });
    },
  });

  const rejectMutation = useMutation<PayoutRecord, ApiError, RejectPayoutPayload>({
    mutationFn: ({ payoutNumber, reason }) =>
      apiClient<PayoutRecord>(`/admin/payouts/${payoutNumber}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] });
    },
  });

  return {
    payouts: query.data?.items ?? [],
    nextCursor: query.data?.next_cursor ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    settlePayout: settleMutation.mutateAsync,
    isSettling: settleMutation.isPending,
    settleError: settleMutation.error,
    rejectPayout: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
    rejectError: rejectMutation.error,
  };
}
