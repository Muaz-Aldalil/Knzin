'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';
import { CANONICAL_LEGAL_SHIELD } from '@/components/checkout/LegalShieldCheckbox';
import { QuizAnswers } from '@/components/checkout/AntiPiracyQuizModal';

export interface CheckoutPayload {
  email: string;
  course_id: string;
  item_type: 'bundle' | 'part';
  course_part_id?: string | null;
  quiz_answers: QuizAnswers;
  idempotency_key?: string;
}

export interface OrderItem {
  id: number;
  order_id: string;
  course_id: string;
  course_part_id?: string | null;
  item_type: 'bundle' | 'part';
  price_cents: number;
  promotional_tickets_granted: number;
}

export interface CreatedOrder {
  id: string;
  order_number: string;
  user_id: string;
  total_amount_cents: number;
  currency: string;
  exchange_rate: string;
  paid_amount_gateway: number;
  display_price_label: string;
  promotional_tickets_granted: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  idempotency_key: string;
  legal_terms_agreed: boolean;
  terms_agreed_ip: string;
  terms_agreed_at: string;
  quiz_answers?: QuizAnswers | null;
  expires_at: string;
  created_at: string;
  items?: OrderItem[];
}

export function useCheckout() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation<CreatedOrder, ApiError, CheckoutPayload>({
    mutationFn: async (payload: CheckoutPayload) => {
      setErrorMessage(null);

      // Generate client UUID for idempotency if not provided
      const idempotencyKey = payload.idempotency_key || (
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      );

      const requestBody = {
        email: payload.email,
        course_id: payload.course_id,
        item_type: payload.item_type,
        course_part_id: payload.course_part_id || null,
        legal_terms_agreed: true,
        legal_shield_text: CANONICAL_LEGAL_SHIELD,
        idempotency_key: idempotencyKey,
        quiz_answers: payload.quiz_answers,
      };

      return apiClient<CreatedOrder>('/checkout/orders', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    },
    onError: (error: ApiError) => {
      setErrorMessage(error.message || 'فشلت معالجة الطلب. يرجى المحاولة مرة أخرى.');
    },
  });

  return {
    createOrder: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: errorMessage,
    createdOrder: mutation.data,
    reset: () => {
      mutation.reset();
      setErrorMessage(null);
    },
  };
}
