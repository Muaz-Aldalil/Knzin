'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { CheckCircle2, Ticket, Clock, CreditCard, ShieldCheck, ArrowRight, Smartphone } from 'lucide-react';
import { CreatedOrder } from '@/hooks/useCheckout';

interface OrderSummaryCardProps {
  order: CreatedOrder;
}

export default function OrderSummaryCard({ order }: OrderSummaryCardProps) {
  const t = useTranslations('orderSummary');
  const tCommon = useTranslations('common');

  const formattedExpiresAt = new Date(order.expires_at).toLocaleString('ar-IQ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Top Success Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center">
        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          {t('title')}
        </h1>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2.5 rounded-full bg-white/20 text-xs font-semibold text-white">
          <Clock className="w-3.5 h-3.5" />
          <span>{t('statusPending')}</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Core Order Data Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              {t('orderNumber')}
            </span>
            <span className="text-sm font-extrabold text-[#0B1E3A] dark:text-blue-400 font-mono">
              {order.order_number}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 font-medium block">
              {t('amountDue')}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                ${(order.total_amount_cents / 100).toFixed(2)}
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                ({order.paid_amount_gateway.toLocaleString()} د.ع)
              </span>
            </div>
          </div>

          <div className="sm:col-span-2 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('ticketsReserved')}
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold text-xs border border-amber-500/30">
              <Ticket className="w-4 h-4" />
              <span>{order.promotional_tickets_granted} {tCommon('ticket')}</span>
            </div>
          </div>
        </div>

        {/* 48-Hour TTL Expiration Notice */}
        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2 font-bold mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>مهلة صلاحية الفاتورة (48 ساعة)</span>
          </div>
          <p className="leading-relaxed">
            {t('expiresNotice', { date: formattedExpiresAt })}
          </p>
        </div>

        {/* Local Payment Instructions (Iraq) */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3.5">
          <h3 className="text-sm font-bold text-[#0B1E3A] dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>{t('paymentInstructionsTitle')}</span>
          </h3>

          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('zainCash')}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{t('qiCard')}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
            {t('offlineSupport')}
          </p>
        </div>

        {/* Personalization Stamp */}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
          <span>تم تخصيص هذه النسخة المبرمجة حصرياً لبياناتك</span>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
          >
            <span>{t('backToCatalog')}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
