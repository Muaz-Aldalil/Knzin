'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CreatedOrder } from '@/hooks/useCheckout';
import OrderSummaryCard from '@/components/checkout/OrderSummaryCard';
import { Loader2, AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function OrderSummaryPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery<CreatedOrder>({
    queryKey: ['order', orderNumber],
    queryFn: () => apiClient<CreatedOrder>(`/checkout/orders/${orderNumber}`),
    enabled: !!orderNumber,
  });

  // State 1: Loading (muaz-skill mandatory state)
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold">جاري استرجاع بيانات الطلب...</p>
      </div>
    );
  }

  // State 2: Error (muaz-skill mandatory state)
  if (isError || !order) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-500/30 text-center">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h2 className="text-base font-bold text-red-900 dark:text-red-200">
          لم يتم العثور على الطلب المطلوب
        </h2>
        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
          {(error as any)?.message || 'تأكد من صحة رقم الطلب المرجعي أو حاول مرة أخرى.'}
        </p>
        <div className="mt-5">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  // State 3: Success / Data
  return (
    <div className="py-6 sm:py-10">
      <OrderSummaryCard order={order} />
    </div>
  );
}
