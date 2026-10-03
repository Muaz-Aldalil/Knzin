'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';

export interface AdminAffiliateItem {
  user_id: number;
  email: string;
  display_name: string | null;
  learner_code: string;
  referral_code: string;
  available_cents: number;
  pending_cents: number;
  lifetime_earned_cents: number;
  pending_payout_count: number;
}

export interface AdminAffiliatesResponse {
  items: AdminAffiliateItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface AdminAffiliateLedgerItem {
  id: number;
  entry_type: string;
  amount_cents: number;
  amount_usd: number;
  currency: string;
  status: 'pending' | 'available' | 'cleared' | 'cancelled';
  funding_source: string;
  idempotency_key: string;
  matures_at: string | null;
  created_at: string;
  order_number?: string | null;
  payout_number?: string | null;
}

export interface AdminAffiliateLedgerResponse {
  items: AdminAffiliateLedgerItem[];
  next_cursor: string | null;
}

export function useAdminAffiliates(page = 1, search = '') {
  const query = useQuery<AdminAffiliatesResponse, ApiError>({
    queryKey: ['admin', 'affiliates', page, search],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '25',
      });
      if (search.trim()) {
        params.append('search', search.trim());
      }
      return apiClient<AdminAffiliatesResponse>(`/admin/affiliates?${params.toString()}`);
    },
    staleTime: 30 * 1000,
  });

  return {
    affiliates: query.data?.items ?? [],
    meta: query.data?.meta ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useAdminAffiliateLedger(userId: number | null, type = 'all', cursor: string | null = null) {
  const query = useQuery<AdminAffiliateLedgerResponse, ApiError>({
    queryKey: ['admin', 'affiliate-ledger', userId, type, cursor],
    queryFn: () => {
      if (!userId) return Promise.reject(new Error('User ID required'));
      const params = new URLSearchParams({
        per_page: '25',
      });
      if (type !== 'all') {
        params.append('type', type);
      }
      if (cursor) {
        params.append('cursor', cursor);
      }
      return apiClient<AdminAffiliateLedgerResponse>(`/admin/affiliates/${userId}/ledger?${params.toString()}`);
    },
    enabled: !!userId,
    staleTime: 15 * 1000,
  });

  return {
    ledgerItems: query.data?.items ?? [],
    nextCursor: query.data?.next_cursor ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
