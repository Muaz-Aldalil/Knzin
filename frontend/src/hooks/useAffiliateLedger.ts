'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';

export type LedgerEntryType = 'all' | 'sales_commission' | 'co_prize_credit' | 'payout_debit' | 'reversal_credit';

export interface AffiliateLedgerEntryItem {
  id: number;
  entry_type: 'sales_commission' | 'co_prize_credit' | 'payout_debit' | 'reversal_credit';
  amount_cents: number;
  amount_formatted: string;
  currency: string;
  status: 'pending' | 'available' | 'cleared' | 'cancelled';
  order_number?: string;
  payout_number?: string;
  description_ar: string;
  description_en: string;
  matures_at?: string | null;
  created_at: string;
}

export interface AffiliateLedgerPagination {
  current_page: number;
  per_page: number;
  total_entries: number;
  total_pages: number;
}

export interface AffiliateLedgerData {
  entries: AffiliateLedgerEntryItem[];
  pagination: AffiliateLedgerPagination;
}

export interface UseAffiliateLedgerOptions {
  page?: number;
  perPage?: number;
  type?: LedgerEntryType;
}

export function useAffiliateLedger(options: UseAffiliateLedgerOptions = {}) {
  const { page = 1, perPage = 15, type = 'all' } = options;
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('knzin_auth_token') : false;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  if (type && type !== 'all') {
    queryParams.append('type', type);
  }

  const query = useQuery<AffiliateLedgerData, ApiError>({
    queryKey: ['affiliate', 'ledger', { page, perPage, type }],
    queryFn: () => apiClient<AffiliateLedgerData>(`/affiliate/ledger?${queryParams.toString()}`),
    enabled: hasToken,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const isUnauthenticated = !hasToken || (query.error instanceof ApiError && query.error.httpStatus === 401);

  return {
    entries: query.data?.entries ?? [],
    pagination: query.data?.pagination ?? {
      current_page: page,
      per_page: perPage,
      total_entries: 0,
      total_pages: 1,
    },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isUnauthenticated,
    refetch: query.refetch,
  };
}
