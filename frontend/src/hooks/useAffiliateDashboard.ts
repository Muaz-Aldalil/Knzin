'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';

export interface ReferralInfo {
  learner_code: string;
  custom_slug: string | null;
  canonical_url: string;
  vanity_url: string | null;
  is_influencer: boolean;
}

export interface AffiliateKpis {
  unpaid_available_cents: number;
  unpaid_available_formatted: string;
  unpaid_available_iqd: number;
  unpaid_pending_cents: number;
  unpaid_pending_formatted: string;
  total_earned_cents: number;
  total_earned_formatted: string;
  total_withdrawn_cents: number;
  total_withdrawn_formatted: string;
  total_referred_orders_count: number;
  active_co_prize_tickets_count: number;
}

export interface CommissionPolicy {
  sales_commission_rate_percent: number;
  minimum_payout_cents: number;
  minimum_payout_formatted: string;
  maturation_hold_hours: number;
  co_prize_share_percent: number;
}

export interface RecentConversion {
  order_number: string;
  course_title_ar: string;
  course_title_en: string;
  purchase_type: 'bundle' | 'part';
  buyer_name: string;
  order_total_formatted: string;
  commission_cents: number;
  commission_formatted: string;
  tickets_granted_to_buyer: number;
  status: 'pending' | 'available' | 'cancelled';
  matures_at: string | null;
  created_at: string;
}

export interface AffiliateDashboardData {
  referral_info: ReferralInfo;
  kpis: AffiliateKpis;
  commission_policy: CommissionPolicy;
  recent_conversions: RecentConversion[];
}

export function useAffiliateDashboard() {
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('knzin_auth_token') : false;

  const query = useQuery<AffiliateDashboardData, ApiError>({
    queryKey: ['affiliate', 'dashboard'],
    queryFn: () => apiClient<AffiliateDashboardData>('/affiliate/dashboard'),
    enabled: hasToken,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const isUnauthenticated = !hasToken || (query.error instanceof ApiError && query.error.httpStatus === 401);

  return {
    dashboard: query.data ?? null,
    referralInfo: query.data?.referral_info ?? null,
    kpis: query.data?.kpis ?? null,
    commissionPolicy: query.data?.commission_policy ?? null,
    recentConversions: query.data?.recent_conversions ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isUnauthenticated,
    refetch: query.refetch,
  };
}
