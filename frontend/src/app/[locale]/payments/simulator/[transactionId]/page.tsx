'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import { useSimulatorTransaction } from '@/hooks/usePaymentSimulator';
import SimulatorDeck from '@/components/payments/SimulatorDeck';
import FinancialImpactInspector from '@/components/payments/FinancialImpactInspector';

export default function SimulatorTransactionPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('simulator');
  const isRtl = locale === 'ar';
  const Arrow = isRtl ? ArrowRight : ArrowLeft;

  const transactionId = params.transactionId as string;

  const { data, isLoading, isError, error } = useSimulatorTransaction(transactionId);

  // State 1: Loading
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-3" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
          {isRtl ? 'جاري تحميل محاكي الدفع التجريبي...' : 'Loading Payment Sandbox Simulator...'}
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">{transactionId}</p>
      </div>
    );
  }

  // State 2: Error
  if (isError || !data) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-center">
        <AlertCircle className="w-12 h-12 text-rose-600 dark:text-rose-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-rose-900 dark:text-rose-200">
          {isRtl ? 'تعذر العثور على المعاملة التجريبية' : 'Simulator Transaction Not Found'}
        </h2>
        <p className="mt-2 text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-mono">
          {(error as any)?.message || transactionId}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
          >
            <Arrow className="w-4 h-4" />
            {isRtl ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
          <Link
            href={`/${locale}/payments/sandbox`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('goToHub')}
          </Link>
        </div>
      </div>
    );
  }

  const handleRedirect = (orderNumber: string) => {
    router.push(`/${locale}/order-summary/${orderNumber}`);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Sandbox Notice Bar */}
        <div className="bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-amber-500 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {t('badge')}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {data.transaction.gateway_transaction_id}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {t('subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Link
              href={`/${locale}/payments/sandbox`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t('goToHub')}
            </Link>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left/Main Column: Action Deck (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <SimulatorDeck 
              transactionData={data} 
              onSuccessRedirect={handleRedirect} 
            />
          </div>

          {/* Right Column: Financial & State Inspector (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <FinancialImpactInspector data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
