'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';

export interface SimulatorTransactionData {
  transaction: {
    id: string;
    gateway_transaction_id: string;
    gateway: string;
    amount_iqd: number;
    currency: string;
    status: 'initiated' | 'processing' | 'success' | 'failed' | 'expired' | 'refunded' | 'duplicate_charge_flagged';
    attempt_number: number;
    created_at?: string;
    paid_at?: string | null;
    expires_at?: string | null;
    is_terminal: boolean;
  };
  order: {
    id: string;
    order_number: string;
    total_amount_cents: number;
    item_type: 'bundle' | 'part';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    tickets_status: 'pending' | 'minted';
    expires_at?: string | null;
  } | null;
  item: {
    course_title_ar: string;
    course_title_en: string;
    item_type: 'bundle' | 'part';
    part_number?: number | null;
    price_cents: number;
    promotional_tickets_granted: number;
  } | null;
  buyer: {
    id?: string | null;
    email?: string | null;
    display_name?: string | null;
  };
  referral: {
    has_attribution: boolean;
    referrer_id?: string | null;
    referrer_name?: string | null;
    referrer_code?: string | null;
    campaign_tag?: string | null;
    is_self_referral: boolean;
    commission_rate_bps: number;
    commission_rate_percent: string;
    projected_commission_cents: number;
    projected_commission_usd: string;
    ledger_status: string;
    matures_at?: string | null;
  };
  financial_ledger: {
    sales_commission?: {
      id: number;
      amount_cents: number;
      status: string;
      matures_at?: string | null;
    } | null;
    reversal_debit?: {
      id: number;
      amount_cents: number;
      status: string;
    } | null;
  };
  entitlements_count: number;
  tickets: Array<{
    id: string;
    serial_number: string;
    order_ticket_index: number;
    issued_at?: string;
  }>;
}

export interface HubTransactionSummary {
  id: string;
  gateway_transaction_id: string;
  order_number: string;
  amount_iqd: number;
  status: string;
  order_status?: string;
  buyer_email?: string;
  referrer_name?: string;
  referral_code?: string;
  checkout_url: string;
  created_at: string;
}

/**
 * Fetch detailed state for an individual simulator transaction.
 */
export function useSimulatorTransaction(transactionRef: string | null | undefined) {
  const query = useQuery<SimulatorTransactionData, ApiError>({
    queryKey: ['simulator-transaction', transactionRef],
    queryFn: async () => {
      if (!transactionRef) throw new Error('Transaction reference is required');
      return apiClient<SimulatorTransactionData>(`/payments/simulator/${transactionRef}`);
    },
    enabled: Boolean(transactionRef),
    refetchInterval: (q) => {
      const data = q.state.data;
      if (data?.transaction?.is_terminal) return false;
      return 3000;
    },
    staleTime: 2000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Simulation Action triggers for Instant Success, Failure, Dropout, Tamper, Replay, Refund, and Reconcile.
 */
export function useSimulatorActions(transactionRef: string, orderNumber?: string) {
  const queryClient = useQueryClient();

  // 1. Instant Success Webhook
  const successMutation = useMutation({
    mutationFn: async ({ amountIqd }: { amountIqd: number }) => {
      return apiClient('/payments/webhooks/simulator', {
        method: 'POST',
        body: JSON.stringify({
          transaction_id: transactionRef,
          outcome: 'success',
          amount_iqd: amountIqd,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulator-transaction', transactionRef] });
      queryClient.invalidateQueries({ queryKey: ['payment-status', orderNumber] });
      queryClient.invalidateQueries({ queryKey: ['learner'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  // 2. Simulated Payment Failure Webhook
  const failureMutation = useMutation({
    mutationFn: async ({ reason }: { reason?: string }) => {
      return apiClient('/payments/webhooks/simulator', {
        method: 'POST',
        body: JSON.stringify({
          transaction_id: transactionRef,
          outcome: 'failed',
          failure_reason: reason || 'insufficient_funds',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulator-transaction', transactionRef] });
      queryClient.invalidateQueries({ queryKey: ['payment-status', orderNumber] });
    },
  });

  // 3. Amount Tampering (Mismatch) Test
  const tamperMutation = useMutation({
    mutationFn: async ({ tamperedAmount }: { tamperedAmount: number }) => {
      return apiClient('/payments/webhooks/simulator', {
        method: 'POST',
        body: JSON.stringify({
          transaction_id: transactionRef,
          outcome: 'success',
          amount_iqd: tamperedAmount,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulator-transaction', transactionRef] });
    },
  });

  // 4. Duplicate Replay (Idempotency) Test
  const replayMutation = useMutation({
    mutationFn: async ({ amountIqd }: { amountIqd: number }) => {
      // Fire twice in quick succession
      const p1 = apiClient('/payments/webhooks/simulator', {
        method: 'POST',
        body: JSON.stringify({
          transaction_id: transactionRef,
          outcome: 'success',
          amount_iqd: amountIqd,
        }),
      });
      const p2 = apiClient('/payments/webhooks/simulator', {
        method: 'POST',
        body: JSON.stringify({
          transaction_id: transactionRef,
          outcome: 'success',
          amount_iqd: amountIqd,
        }),
      });
      return Promise.all([p1, p2]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulator-transaction', transactionRef] });
    },
  });

  // 5. On-Demand Reconciliation
  const reconcileMutation = useMutation({
    mutationFn: async () => {
      return apiClient(`/payments/simulator/${transactionRef}/reconcile`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulator-transaction', transactionRef] });
      queryClient.invalidateQueries({ queryKey: ['payment-status', orderNumber] });
      queryClient.invalidateQueries({ queryKey: ['learner'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  // 6. Simulated Refund / Reversal
  const refundMutation = useMutation({
    mutationFn: async () => {
      return apiClient(`/payments/simulator/${transactionRef}/refund`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulator-transaction', transactionRef] });
      queryClient.invalidateQueries({ queryKey: ['payment-status', orderNumber] });
      queryClient.invalidateQueries({ queryKey: ['learner'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  return {
    triggerSuccess: successMutation.mutateAsync,
    isSuccessLoading: successMutation.isPending,
    triggerFailure: failureMutation.mutateAsync,
    isFailureLoading: failureMutation.isPending,
    triggerTamper: tamperMutation.mutateAsync,
    isTamperLoading: tamperMutation.isPending,
    triggerReplay: replayMutation.mutateAsync,
    isReplayLoading: replayMutation.isPending,
    triggerReconcile: reconcileMutation.mutateAsync,
    isReconcileLoading: reconcileMutation.isPending,
    triggerRefund: refundMutation.mutateAsync,
    isRefundLoading: refundMutation.isPending,
  };
}

/**
 * Developer Sandbox Hub controls (Scenario Launcher, Maturation Sweep, Co-Prize simulation).
 */
export function useSandboxHub() {
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery<{ transactions: HubTransactionSummary[] }, ApiError>({
    queryKey: ['simulator-hub-transactions'],
    queryFn: async () => {
      return apiClient<{ transactions: HubTransactionSummary[] }>('/payments/simulator/transactions');
    },
    refetchInterval: 5000,
  });

  const seedScenarioMutation = useMutation({
    mutationFn: async ({ scenario }: { scenario: 'bundle_with_referral' | 'part_with_referral' | 'bundle_no_referral' | 'self_referral_exploit' }) => {
      return apiClient<{
        scenario: string;
        order_number: string;
        transaction_id: string;
        checkout_url: string;
        amount_iqd: number;
        buyer_email: string;
        referral_code?: string;
      }>('/payments/simulator/seed-scenario', {
        method: 'POST',
        body: JSON.stringify({ scenario }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulator-hub-transactions'] });
    },
  });

  const fastForwardMutation = useMutation({
    mutationFn: async (userId?: string) => {
      return apiClient<{ matured_count: number; message: string }>('/payments/simulator/fast-forward-maturation', {
        method: 'POST',
        body: JSON.stringify(userId ? { user_id: userId } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulator-hub-transactions'] });
    },
  });

  const simulateCoPrizeMutation = useMutation({
    mutationFn: async (payload?: { ticket_serial?: string; prize_valuation_usd?: number }) => {
      return apiClient<{
        co_prize_awarded: boolean;
        ticket_serial: string;
        amount_cents: number;
        amount_usd: string;
        message: string;
      }>('/payments/simulator/simulate-co-prize', {
        method: 'POST',
        body: JSON.stringify(payload || {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulator-hub-transactions'] });
    },
  });

  return {
    transactions: transactionsQuery.data?.transactions ?? [],
    isTransactionsLoading: transactionsQuery.isLoading,
    refetchTransactions: transactionsQuery.refetch,
    seedScenario: seedScenarioMutation.mutateAsync,
    isSeeding: seedScenarioMutation.isPending,
    seedData: seedScenarioMutation.data,
    fastForwardMaturation: fastForwardMutation.mutateAsync,
    isFastForwarding: fastForwardMutation.isPending,
    simulateCoPrize: simulateCoPrizeMutation.mutateAsync,
    isSimulatingCoPrize: simulateCoPrizeMutation.isPending,
  };
}
