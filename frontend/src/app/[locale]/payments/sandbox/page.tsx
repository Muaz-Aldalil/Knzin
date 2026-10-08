'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  SlidersHorizontal, 
  Sparkles, 
  Clock, 
  Trophy, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShoppingBag, 
  UserCheck, 
  ArrowLeft, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useSandboxHub } from '@/hooks/usePaymentSimulator';

export default function SandboxHubPage() {
  const t = useTranslations('simulator');
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === 'ar';
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const {
    transactions,
    isTransactionsLoading,
    refetchTransactions,
    seedScenario,
    isSeeding,
    seedData,
    fastForwardMaturation,
    isFastForwarding,
    simulateCoPrize,
    isSimulatingCoPrize,
  } = useSandboxHub();

  const handleSeed = async (scenario: 'bundle_with_referral' | 'part_with_referral' | 'bundle_no_referral' | 'self_referral_exploit') => {
    try {
      setFeedback(null);
      const res = await seedScenario({ scenario });
      setFeedback({ 
        type: 'success', 
        message: `تم إنشاء الطلب ${res.order_number} بنجاح! جاري التوجيه لمحاكي الدفع...` 
      });
      setTimeout(() => {
        router.push(res.checkout_url);
      }, 1000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'فشل توليد سيناريو الطلب.' });
    }
  };

  const handleFastForward = async () => {
    try {
      setFeedback(null);
      const res = await fastForwardMaturation();
      setFeedback({ type: 'success', message: res.message });
      refetchTransactions();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'فشلت معالجة تسريع النضج.' });
    }
  };

  const handleCoPrize = async () => {
    try {
      setFeedback(null);
      const res = await simulateCoPrize({ prize_valuation_usd: 50000 });
      setFeedback({ type: 'success', message: res.message });
      refetchTransactions();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'فشلت محاكاة الجائزة المشتركة.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {t('badge')}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-6 h-6 text-amber-500" />
              {t('hubTitle')}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {t('hubSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/affiliate`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition"
            >
              <UserCheck className="w-4 h-4" />
              {t('viewAffiliateDashboard')}
            </Link>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            )}
            <span className="font-medium leading-relaxed">{feedback.message}</span>
          </div>
        )}

        {/* Section 1: 1-Click Scenario Orders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {t('seedSectionTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              انقر لتوليد طلب فوري والانتقال مباشرة لمحاكي الدفع لاختبار الاستيفاء والتذاكر والعمولات:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleSeed('bundle_with_referral')}
              disabled={isSeeding}
              className="flex items-center justify-between p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 transition text-right rtl:text-right ltr:text-left disabled:opacity-50 group"
            >
              <div className="flex items-center gap-3">
                <div className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block">
                    {t('seedBundleReferral')}
                  </span>
                  <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                    15 تذكرة + $2.50 عمولة لمسوق علي فرج
                  </span>
                </div>
              </div>
              <Arrow className="w-4 h-4 text-emerald-600 shrink-0 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => handleSeed('part_with_referral')}
              disabled={isSeeding}
              className="flex items-center justify-between p-4 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-950/40 transition text-right rtl:text-right ltr:text-left disabled:opacity-50 group"
            >
              <div className="flex items-center gap-3">
                <div className="text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-950 dark:text-blue-200 block">
                    {t('seedPartReferral')}
                  </span>
                  <span className="text-[11px] text-blue-700/80 dark:text-blue-400/80">
                    تذكرة واحدة + $0.50 عمولة لمسوق علي فرج
                  </span>
                </div>
              </div>
              <Arrow className="w-4 h-4 text-blue-600 shrink-0 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => handleSeed('bundle_no_referral')}
              disabled={isSeeding}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-right rtl:text-right ltr:text-left disabled:opacity-50 group"
            >
              <div className="flex items-center gap-3">
                <div className="text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {t('seedBundleClean')}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    15 تذكرة دون إحالة ودون عمولات
                  </span>
                </div>
              </div>
              <Arrow className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => handleSeed('self_referral_exploit')}
              disabled={isSeeding}
              className="flex items-center justify-between p-4 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 transition text-right rtl:text-right ltr:text-left disabled:opacity-50 group"
            >
              <div className="flex items-center gap-3">
                <div className="text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-rose-950 dark:text-rose-200 block">
                    {t('seedSelfReferral')}
                  </span>
                  <span className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
                    اختبار رفض العمولة عند شراء المسوق لنفسه
                  </span>
                </div>
              </div>
              <Arrow className="w-4 h-4 text-rose-600 shrink-0 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Section 2: Commission Maturation & Draw Co-Prize Testing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Maturation Accelerator */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('fastForwardTitle')}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                {t('fastForwardDesc')}
              </p>
            </div>

            <button
              onClick={handleFastForward}
              disabled={isFastForwarding}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isFastForwarding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              {t('fastForwardBtn')}
            </button>
          </div>

          {/* Draw Co-Prize Simulator */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('coPrizeTitle')}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                {t('coPrizeDesc')}
              </p>
            </div>

            <button
              onClick={handleCoPrize}
              disabled={isSimulatingCoPrize}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isSimulatingCoPrize ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
              {t('coPrizeBtn')}
            </button>
          </div>
        </div>

        {/* Section 3: Recent Simulated Transactions Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('recentTransactionsTitle')}
            </h2>
            <button
              onClick={() => refetchTransactions()}
              disabled={isTransactionsLoading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isTransactionsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {transactions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              لا توجد معاملات تجريبية مسجلة بعد. استخدم أزرار التوليد بالأعلى لبدء الاختبار.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">رقم الطلب</th>
                    <th className="py-2.5 px-3">المبلغ</th>
                    <th className="py-2.5 px-3">حالة الدفع</th>
                    <th className="py-2.5 px-3">المشتري</th>
                    <th className="py-2.5 px-3">المسوق</th>
                    <th className="py-2.5 px-3 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-mono font-medium text-slate-900 dark:text-white">
                        {tx.order_number || 'N/A'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {tx.amount_iqd.toLocaleString()} د.ع
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          tx.status === 'failed' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' :
                          'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                        {tx.buyer_email || 'Guest'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {tx.referrer_name ? (
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {tx.referrer_name} ({tx.referral_code})
                          </span>
                        ) : (
                          <span className="text-slate-400">مباشر</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Link
                          href={tx.checkout_url || `/${locale}/payments/simulator/${tx.gateway_transaction_id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {t('openSimulator')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
