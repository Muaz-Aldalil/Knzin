'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  CheckCircle2, 
  XCircle, 
  WifiOff, 
  ShieldAlert, 
  Copy, 
  RotateCcw, 
  RefreshCw, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useSimulatorActions, SimulatorTransactionData } from '@/hooks/usePaymentSimulator';

interface SimulatorDeckProps {
  transactionData: SimulatorTransactionData;
  onSuccessRedirect?: (orderNumber: string) => void;
}

export default function SimulatorDeck({ transactionData, onSuccessRedirect }: SimulatorDeckProps) {
  const t = useTranslations('simulator');
  const locale = useLocale();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const { transaction, order } = transactionData;
  const transactionRef = transaction.gateway_transaction_id || transaction.id;
  const orderNumber = order?.order_number;

  const {
    triggerSuccess,
    isSuccessLoading,
    triggerFailure,
    isFailureLoading,
    triggerTamper,
    isTamperLoading,
    triggerReplay,
    isReplayLoading,
    triggerReconcile,
    isReconcileLoading,
    triggerRefund,
    isRefundLoading,
  } = useSimulatorActions(transactionRef, orderNumber);

  const isTerminal = transaction.is_terminal;
  const isCompleted = order?.status === 'completed';

  const handleInstantSuccess = async () => {
    try {
      setFeedback(null);
      await triggerSuccess({ amountIqd: transaction.amount_iqd });
      setFeedback({ type: 'success', message: 'تم إرسال إشعار السداد بنجاح وتفعيل الطلب والتذاكر!' });
      if (onSuccessRedirect && orderNumber) {
        setTimeout(() => {
          onSuccessRedirect(orderNumber);
        }, 1200);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'فشلت معالجة إشعار السداد.' });
    }
  };

  const handlePaymentFailure = async () => {
    try {
      setFeedback(null);
      await triggerFailure({ reason: 'insufficient_funds' });
      setFeedback({ type: 'info', message: 'تم تسجيل فشل المعاملة بنجاح.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'فشل تحديث المعاملة.' });
    }
  };

  const handleCarrierDropout = () => {
    if (orderNumber) {
      // Simulate dropped connection: navigate back to order summary without webhook
      window.location.href = `/${locale}/order-summary/${orderNumber}`;
    }
  };

  const handleAmountTampering = async () => {
    try {
      setFeedback(null);
      // Send deliberate wrong amount to verify rejection
      const tampered = transaction.amount_iqd === 2600 ? 500 : 1000;
      await triggerTamper({ tamperedAmount: tampered });
      setFeedback({ type: 'info', message: 'تم إرسال قيمة غير متطابقة لاختبار درع الأمان.' });
    } catch (err: any) {
      setFeedback({ type: 'success', message: 'نجح درع الأمان: تم رفض المبلغ المتلاعب به (HTTP 422 ERR_AMOUNT_MISMATCH).' });
    }
  };

  const handleDuplicateReplay = async () => {
    try {
      setFeedback(null);
      await triggerReplay({ amountIqd: transaction.amount_iqd });
      setFeedback({ type: 'success', message: 'تم فحص تكرار الإشعار بنجاح: تم قبول الطلب دون تكرار أي تذاكر أو عمولات (Idempotent OK).' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'حدث خطأ أثناء اختبار تكرار الإشعار.' });
    }
  };

  const handleManualReconcile = async () => {
    try {
      setFeedback(null);
      await triggerReconcile();
      setFeedback({ type: 'success', message: 'تم استرداد المعاملة واستيفاء الطلب بنجاح عبر محرك التسوية.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'فشلت تسوية المعاملة.' });
    }
  };

  const handleSimulateRefund = async () => {
    try {
      setFeedback(null);
      await triggerRefund();
      setFeedback({ type: 'info', message: 'تم استرداد المعاملة وإنشاء قيد عكسي مخصوم في سجل المسوق بنجاح.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'فشل تنفيذ الاسترداد.' });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            {t('actionsTitle')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('actionsSubtitle')}
          </p>
        </div>
        <span className="text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-full">
          {transaction.status}
        </span>
      </div>

      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : feedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          ) : feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          ) : (
            <RefreshCw className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          )}
          <span className="font-medium leading-relaxed">{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* 1. Instant Success */}
        <button
          onClick={handleInstantSuccess}
          disabled={isSuccessLoading || isCompleted}
          className="flex items-start gap-3.5 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 transition text-start disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {isSuccessLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
              {t('btnSuccess')}
            </div>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1 leading-relaxed">
              {t('btnSuccessDesc')}
            </p>
          </div>
        </button>

        {/* 2. Payment Failure */}
        <button
          onClick={handlePaymentFailure}
          disabled={isFailureLoading || isTerminal}
          className="flex items-start gap-3.5 p-4 rounded-xl border border-rose-200 dark:border-rose-800/70 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 transition text-start disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {isFailureLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-sm font-bold text-rose-900 dark:text-rose-300">
              {t('btnFail')}
            </div>
            <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1 leading-relaxed">
              {t('btnFailDesc')}
            </p>
          </div>
        </button>

        {/* 3. Carrier Timeout / Dropout */}
        <button
          onClick={handleCarrierDropout}
          className="flex items-start gap-3.5 p-4 rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 transition text-start group"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <WifiOff className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-amber-900 dark:text-amber-300">
              {t('btnTimeout')}
            </div>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 leading-relaxed">
              {t('btnTimeoutDesc')}
            </p>
          </div>
        </button>

        {/* 4. Security Amount Tampering */}
        <button
          onClick={handleAmountTampering}
          disabled={isTamperLoading}
          className="flex items-start gap-3.5 p-4 rounded-xl border border-purple-200 dark:border-purple-800/70 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/60 dark:hover:bg-purple-950/40 transition text-start disabled:opacity-50 group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {isTamperLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-sm font-bold text-purple-900 dark:text-purple-300">
              {t('btnTamper')}
            </div>
            <p className="text-xs text-purple-700/80 dark:text-purple-400/80 mt-1 leading-relaxed">
              {t('btnTamperDesc')}
            </p>
          </div>
        </button>

        {/* 5. Duplicate Replay (Idempotency) */}
        <button
          onClick={handleDuplicateReplay}
          disabled={isReplayLoading}
          className="flex items-start gap-3.5 p-4 rounded-xl border border-sky-200 dark:border-sky-800/70 bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-100/60 dark:hover:bg-sky-950/40 transition text-start disabled:opacity-50 group"
        >
          <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {isReplayLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Copy className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-sm font-bold text-sky-900 dark:text-sky-300">
              {t('btnReplay')}
            </div>
            <p className="text-xs text-sky-700/80 dark:text-sky-400/80 mt-1 leading-relaxed">
              {t('btnReplayDesc')}
            </p>
          </div>
        </button>

        {/* 6. On-Demand Reconciliation */}
        <button
          onClick={handleManualReconcile}
          disabled={isReconcileLoading || isCompleted}
          className="flex items-start gap-3.5 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/60 dark:hover:bg-indigo-950/40 transition text-start disabled:opacity-50 group"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {isReconcileLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-sm font-bold text-indigo-900 dark:text-indigo-300">
              {t('btnReconcile')}
            </div>
            <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80 mt-1 leading-relaxed">
              {t('btnReconcileDesc')}
            </p>
          </div>
        </button>

        {/* 7. Refund / Reversal */}
        <button
          onClick={handleSimulateRefund}
          disabled={isRefundLoading || !isCompleted}
          className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-start disabled:opacity-50 group md:col-span-2"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {isRefundLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {t('btnRefund')}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {t('btnRefundDesc')}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
