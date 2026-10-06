'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { 
  ShieldCheck, 
  UserCheck, 
  Ticket, 
  GraduationCap, 
  ExternalLink, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { SimulatorTransactionData } from '@/hooks/usePaymentSimulator';

interface FinancialImpactInspectorProps {
  data: SimulatorTransactionData;
}

export default function FinancialImpactInspector({ data }: FinancialImpactInspectorProps) {
  const t = useTranslations('simulator');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const Arrow = isRtl ? ChevronLeft : ChevronRight;

  const { transaction, order, item, buyer, referral, financial_ledger, tickets, entitlements_count } = data;

  const isCompleted = order?.status === 'completed';
  const isRefunded = order?.status === 'refunded';

  return (
    <div className="space-y-6">
      {/* 1. Order & Billing Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {t('orderCardTitle')}
          </h3>
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {order?.order_number || 'N/A'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">{t('course')}</span>
            <span className="font-bold text-slate-900 dark:text-white truncate block">
              {isRtl ? item?.course_title_ar : item?.course_title_en}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">{t('package')}</span>
            <span className="inline-block px-2 py-0.5 rounded-full font-semibold text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {item?.item_type === 'bundle' ? t('bundle') : t('part')}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">{t('priceIqd')}</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {transaction.amount_iqd.toLocaleString()} {isRtl ? 'د.ع' : 'IQD'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">{t('buyer')}</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
              {buyer.email || buyer.display_name || 'Guest'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Referral & Affiliate Attribution Audit Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {t('attributionTitle')}
          </h3>
          {referral.has_attribution ? (
            referral.is_self_referral ? (
              <span className="text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {t('attributionSelfBlocked')}
              </span>
            ) : (
              <span className="text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {t('attributionValid')}
              </span>
            )
          ) : (
            <span className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
              {t('attributionNone')}
            </span>
          )}
        </div>

        {referral.has_attribution ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">{t('referrer')}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {referral.referrer_name || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">{t('referralCode')}</span>
                <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  {referral.referrer_code}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">{t('commissionRate')}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {referral.commission_rate_percent}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">{t('projectedCommission')}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ${referral.projected_commission_usd} USD
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                {t('maturationNotice')}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {financial_ledger.sales_commission ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {financial_ledger.sales_commission.status.toUpperCase()}
                  </span>
                ) : (
                  <span className="text-slate-400">PENDING FULFILLMENT</span>
                )}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('attributionNone')} — لم يتم تفعيل أي رمز إحالة أثناء فتح الطلب، ولن يتم احتساب أي عمولة مسوق.
          </p>
        )}
      </div>

      {/* 3. Live System State & Financial Impact Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          {t('liveStateTitle')}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mb-6">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-400 block mb-1">{t('orderStatus')}</span>
            <span className={`font-bold capitalize ${
              isCompleted ? 'text-emerald-600 dark:text-emerald-400' :
              isRefunded ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {order?.status || 'N/A'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-400 block mb-1">{t('entitlementsUnlocked')}</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {entitlements_count} {isRtl ? 'أجزاء مفتوحة' : 'Parts'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-400 block mb-1">{t('ticketsMinted')}</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5" />
              {tickets.length} {isRtl ? 'تذكرة سحب' : 'Tickets'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-400 block mb-1">{t('affiliateLedger')}</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {financial_ledger.reversal_debit ? (
                <span className="text-rose-600">REVERSED (${financial_ledger.reversal_debit.amount_cents / 100})</span>
              ) : financial_ledger.sales_commission ? (
                <span className="text-emerald-600">${financial_ledger.sales_commission.amount_cents / 100} USD</span>
              ) : (
                <span className="text-slate-400">NONE</span>
              )}
            </span>
          </div>
        </div>

        {/* Issued Tickets Serial Badges */}
        {tickets.length > 0 && (
          <div className="mb-6">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              {isRtl ? 'أرقام التذاكر الترويجية الصادرة:' : 'Minted Promotional Ticket Serials:'}
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              {tickets.map((t) => (
                <span
                  key={t.id}
                  className="font-mono text-[11px] bg-amber-100/70 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800"
                >
                  {t.serial_number}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Nav Links */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2.5">
          {order?.order_number && (
            <Link
              href={`/${locale}/order-summary/${order.order_number}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t('viewOrderSummary')}
            </Link>
          )}

          <Link
            href={`/${locale}/affiliate`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition"
          >
            <UserCheck className="w-3.5 h-3.5" />
            {t('viewAffiliateDashboard')}
          </Link>

          <Link
            href={`/${locale}/payments/sandbox`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white transition"
          >
            {t('goToHub')}
            <Arrow className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
