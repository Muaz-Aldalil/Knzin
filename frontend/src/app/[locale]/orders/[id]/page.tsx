'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { apiClient } from '@/lib/api-client';
import { CreatedOrder } from '@/hooks/useCheckout';
import OrderSummaryCard from '@/components/checkout/OrderSummaryCard';
import { Loader2, AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function OrderDetailPage() {
  const params = useParams();
  const orderIdentifier = (params?.id || params?.orderNumber) as string;

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery<CreatedOrder>({
    queryKey: ['order', orderIdentifier],
    queryFn: async () => {
      let emailParam = '';
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        emailParam = searchParams.get('email') || localStorage.getItem('knzin_guest_email') || '';
      }
      const endpoint = emailParam
        ? `/checkout/orders/${orderIdentifier}?email=${encodeURIComponent(emailParam)}`
        : `/checkout/orders/${orderIdentifier}`;
      return await apiClient<CreatedOrder>(endpoint);
    },
    enabled: !!orderIdentifier,
  });

  const locale = useLocale();
  const isRtl = locale === 'ar';

  // State 1: Loading
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm font-semibold">
          {isRtl ? 'جاري استرجاع بيانات الطلب...' : 'Retrieving order details...'}
        </p>
      </div>
    );
  }

  // State 2: Error
  if (isError || !order) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-500/30 text-center">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h2 className="text-base font-bold text-red-900 dark:text-red-200">
          {isRtl ? 'لم يتم العثور على الطلب المطلوب' : 'Order Not Found'}
        </h2>
        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
          {(error as any)?.message || (isRtl ? 'تأكد من صحة رقم الطلب المرجعي أو حاول مرة أخرى.' : 'Please verify your order reference number or try again.')}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors"
          >
            {isRtl ? 'لوحة تدريبي' : 'My Dashboard'}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-surface-secondary text-content-primary text-xs font-bold hover:bg-surface-elevated transition-colors border border-border-subtle"
          >
            {isRtl ? 'الرئيسية' : 'Home'}
          </Link>
        </div>
      </div>
    );
  }

  // State 3: Success
  return (
    <div className="py-6 sm:py-10">
      <OrderSummaryCard order={order} />
    </div>
  );
}
