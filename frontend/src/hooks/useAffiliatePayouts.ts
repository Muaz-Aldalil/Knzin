'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';

export type PayoutMethod = 'zain_cash' | 'asia_hawala' | 'western_union';

export interface PayoutRequestPayload {
  amount_cents: number;
  payout_method: PayoutMethod;
  recipient_details: {
    phone_number?: string;
    account_name: string;
    governorate?: string;
    [key: string]: any;
  };
}

export interface PayoutResponseData {
  payout_number: string;
  amount_cents: number;
  amount_formatted: string;
  amount_iqd: number;
  threshold_cents_at_request: number;
  payout_method: string;
  status: string;
  status_label_ar: string;
  status_label_en: string;
  recipient_details: Record<string, any>;
  remaining_available_cents: number;
  created_at: string;
}

export interface PayoutHistoryItem {
  payout_number: string;
  amount_cents: number;
  amount_formatted: string;
  amount_iqd: number;
  threshold_cents_at_request: number;
  payout_method: string;
  status: string;
  admin_reference_number: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface PayoutHistoryResponse {
  payouts: PayoutHistoryItem[];
}

export function useAffiliatePayouts() {
  const queryClient = useQueryClient();
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('knzin_auth_token') : false;

  const historyQuery = useQuery<PayoutHistoryResponse, ApiError>({
    queryKey: ['affiliate', 'payouts'],
    queryFn: () => apiClient<PayoutHistoryResponse>('/affiliate/payouts'),
    enabled: hasToken,
    staleTime: 60 * 1000,
  });

  const requestPayoutMutation = useMutation<PayoutResponseData, ApiError, PayoutRequestPayload>({
    mutationFn: (payload: PayoutRequestPayload) =>
      apiClient<PayoutResponseData>('/affiliate/payouts/request', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      // Invalidate dashboard, ledger, and payout history on new request
      queryClient.invalidateQueries({ queryKey: ['affiliate', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate', 'ledger'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate', 'payouts'] });
    },
  });

  return {
    payouts: historyQuery.data?.payouts ?? [],
    isHistoryLoading: historyQuery.isLoading,
    isHistoryError: historyQuery.isError,
    historyError: historyQuery.error,
    requestPayout: requestPayoutMutation.mutateAsync,
    isSubmitting: requestPayoutMutation.isPending,
    submissionError: requestPayoutMutation.error,
    isSubmissionSuccess: requestPayoutMutation.isSuccess,
    resetSubmission: requestPayoutMutation.reset,
    refetchHistory: historyQuery.refetch,
  };
}
