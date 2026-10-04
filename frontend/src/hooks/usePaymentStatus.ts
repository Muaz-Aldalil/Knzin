'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';

export interface LatestPaymentTransaction {
  id: string;
  gateway: 'zaincash' | 'asiahawala' | 'simulator';
  gateway_transaction_id?: string | null;
  status: 'initiated' | 'processing' | 'success' | 'failed' | 'expired' | 'duplicate_charge_flagged';
  paid_at?: string | null;
  error_message?: string | null;
}

export interface PaymentStatusData {
  order_number: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  tickets_status: 'pending' | 'minted';
  promotional_tickets_granted: number;
  paid_amount_gateway: number;
  currency: string;
  latest_transaction?: LatestPaymentTransaction | null;
}

export function usePaymentStatus(orderNumber?: string | null, enabled: boolean = true) {
  const [attempts, setAttempts] = useState(0);

  const query = useQuery<PaymentStatusData, ApiError>({
    queryKey: ['payment-status', orderNumber],
    queryFn: async () => {
      if (!orderNumber) throw new Error('Order number is required');
      setAttempts((prev) => prev + 1);
      return apiClient<PaymentStatusData>(`/checkout/orders/${orderNumber}/payment-status`);
    },
    enabled: Boolean(orderNumber) && enabled,
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return 3000;
      if (data.status === 'completed' || data.status === 'failed') {
        return false;
      }
      if (attempts >= 20) {
        return false;
      }
      return 3000;
    },
    refetchIntervalInBackground: true,
    staleTime: 1000,
  });

  const data = query.data;
  const isCompleted = data?.status === 'completed';
  const isFailed = data?.status === 'failed' || data?.latest_transaction?.status === 'failed';
  const isPending = data?.status === 'pending' && !isFailed;
  const isTimedOut = attempts >= 20 && isPending;

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isCompleted,
    isFailed,
    isPending,
    isTimedOut,
    attempts,
    refetch: query.refetch,
  };
}
