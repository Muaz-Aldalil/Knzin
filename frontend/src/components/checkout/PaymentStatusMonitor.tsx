'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Ticket, 
  RotateCw, 
  ArrowRight,
  WalletCards,
  PlayCircle
} from 'lucide-react';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface PaymentStatusMonitorProps {
  orderNumber: string;
  courseSlug?: string;
  initialGateway?: string;
  onGatewayChange?: () => void;
}

export default function PaymentStatusMonitor({
  orderNumber,
  courseSlug,
  initialGateway = 'zaincash',
  onGatewayChange,
}: PaymentStatusMonitorProps) {
  const t = useTranslations('payment');
  const tOrder = useTranslations('orderSummary');
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === 'ar';
  const queryClient = useQueryClient();

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulateError, setSimulateError] = useState<string | null>(null);

  const isDemoOrPreview =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true' ||
    (typeof window !== 'undefined' && (
      window.location.hostname.includes('netlify.app') ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ));

  const handleSimulatePayment = async () => {
    try {
      setIsSimulating(true);
      setSimulateError(null);
      await apiClient(`/checkout/orders/${orderNumber}/simulate-success`, {
        method: 'POST',
      });
      queryClient.invalidateQueries({ queryKey: ['learner'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      await refetch();
    } catch (err: any) {
      setSimulateError(err?.message || (isRtl ? 'فشلت محاكاة الدفع' : 'Payment simulation failed'));
    } finally {
      setIsSimulating(false);
    }
  };

  const {
    data,
    isLoading,
    isCompleted,
    isFailed,
    isPending,
    isTimedOut,
    refetch,
  } = usePaymentStatus(orderNumber);

  // Invalidate learner dashboard and tickets cache immediately when payment completes
  React.useEffect(() => {
    if (isCompleted) {
      queryClient.invalidateQueries({ queryKey: ['learner'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    }
  }, [isCompleted, queryClient]);

  const handleRetryPayment = async (gatewayChoice: string) => {
    try {
      setIsRetrying(true);
      setRetryError(null);

      const payData = await apiClient<{
        success: boolean;
        data: {
          checkout_url: string;
          gateway_transaction_id: string;
        };
      }>(`/checkout/orders/${orderNumber}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          gateway: gatewayChoice,
          locale,
        }),
      });

      if (payData?.data?.checkout_url) {
        window.location.href = payData.data.checkout_url;
      } else {
        refetch();
      }
    } catch (err: any) {
      setRetryError(err?.message || 'فشلت إعادة محاولة الدفع');
    } finally {
      setIsRetrying(false);
    }
  };

  // 1. Success State: Celebration, Tickets, Course Unlock CTA
  if (isCompleted) {
    const promotionalTickets = data?.promotional_tickets_granted ?? 1;

    return (
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border-2 border-emerald-500/40 dark:border-emerald-500/30 text-center animate-in zoom-in-95 duration-300">
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 text-emerald-500/30">
          <Sparkles className="w-10 h-10 animate-pulse" />
        </div>

        <div className="inline-flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
          <CheckCircle2 className="w-16 h-16" />
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
          {t('paymentSuccessTitle')}
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-6">
          {t('paymentSuccessDesc')}
        </p>

        {/* Tickets Badge */}
        <div className="inline-flex items-center gap-2 text-accent font-bold text-sm mb-6">
          <Ticket className="w-5 h-5 animate-bounce" />
          <span>
            {isRtl 
              ? `تم تفعيل ${promotionalTickets} تذكرة سحب ترويجية مجانية لحسابك`
              : `${promotionalTickets} promotional sweepstakes ticket(s) granted`
            }
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={async () => {
              await queryClient.invalidateQueries({ queryKey: ['learner'] });
              if (courseSlug) {
                router.push(`/lessons/${courseSlug}` as any);
              } else {
                router.push('/dashboard' as any);
              }
            }}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <PlayCircle className="w-5 h-5" />
            <span>{t('startCourse')}</span>
            <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>

          <button
            type="button"
            onClick={async () => {
              await queryClient.invalidateQueries({ queryKey: ['learner'] });
              router.push('/dashboard' as any);
            }}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Ticket className="w-4 h-4 text-accent" />
            <span>{isRtl ? 'لوحة تدريبي وتذاكري' : 'My Hub & Tickets'}</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Failed State: Recovery Actions (Decision D-7)
  if (isFailed) {
    const latestGateway = data?.latest_transaction?.gateway || initialGateway;

    return (
      <div className="p-6 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border-2 border-rose-500/30 text-center animate-in fade-in duration-200">
        <div className="inline-flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3">
          <AlertCircle className="w-14 h-14" />
        </div>

        <h3 className="text-lg font-black text-rose-900 dark:text-rose-200 mb-1">
          {t('paymentFailedTitle')}
        </h3>

        <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300/90 max-w-md mx-auto mb-5">
          {data?.latest_transaction?.error_message || t('paymentFailedDesc')}
        </p>

        {retryError && (
          <div className="p-3 mb-4 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-semibold">
            {retryError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Retry current gateway */}
          <button
            type="button"
            disabled={isRetrying}
            onClick={() => handleRetryPayment(latestGateway)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {isRetrying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCw className="w-4 h-4" />
            )}
            <span>{t('retryPayment')}</span>
          </button>

          {/* Switch gateway */}
          {onGatewayChange && (
            <button
              type="button"
              onClick={onGatewayChange}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              <WalletCards className="w-4 h-4 text-slate-500" />
              <span>{t('switchGateway')}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Pending / Polling State
  return (
    <div className="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300/50 dark:border-amber-700/40 text-center animate-in fade-in duration-200">
      <div className="inline-flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>

      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
        {t('checkingPayment')}
      </h3>

      <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto mb-3">
        {t('paymentPendingDesc')}
      </p>

      {isTimedOut && (
        <div className="p-3 mt-3 rounded-xl bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-xs text-start">
          {t('timeoutNotice')}
        </div>
      )}

      {/* 1-Click Instant Mock Payment for Devs & Demo */}
      {isDemoOrPreview && (
        <div className="mt-4 p-4 rounded-xl bg-primary/10 border-2 border-primary/30 text-start space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {isRtl ? 'بيئة تجريبية: محاكاة الدفع وتفعيل المحتوى' : 'Demo Mode: Instant Payment & Unlock'}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            {isRtl
              ? 'تأكيد الدفع التجريبي فوراً لتفعيل اشتراك الدورة، فتح جميع الأجزاء المغلقة، وإصدار تذاكر السحب الترويجية في حسابك مباشرة دون انتظار البوابة.'
              : 'Instantly simulate successful payment to unlock all course parts and mint promotional tickets immediately without waiting for external gateway.'}
          </p>
          {simulateError && (
            <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs font-semibold">
              {simulateError}
            </div>
          )}
          <button
            type="button"
            disabled={isSimulating}
            onClick={handleSimulatePayment}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSimulating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {isRtl
                ? 'تأكيد الدفع التجريبي وتفعيل الدورة والتذاكر الآن ⚡'
                : 'Confirm Mock Payment & Unlock Everything Now ⚡'}
            </span>
          </button>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => refetch()}
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{isRtl ? 'تحديث يدوي للحالة' : 'Refresh status'}</span>
        </button>
      </div>
    </div>
  );
}
