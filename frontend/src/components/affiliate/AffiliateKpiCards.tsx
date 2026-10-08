'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Wallet, Clock, TrendingUp, Ticket, ArrowUpRight } from 'lucide-react';
import { AffiliateKpis } from '@/hooks/useAffiliateDashboard';

interface AffiliateKpiCardsProps {
  kpis: AffiliateKpis;
  minimumPayoutCents?: number;
  onRequestPayoutClick?: () => void;
}

export function AffiliateKpiCards({
  kpis,
  minimumPayoutCents = 5000,
  onRequestPayoutClick,
}: AffiliateKpiCardsProps) {
  const t = useTranslations('affiliate');

  const isEligibleForPayout = kpis.unpaid_available_cents >= minimumPayoutCents;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Unpaid Available Balance */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
              {t('unpaidAvailable')}
            </span>
            <Wallet className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-content-primary tracking-tight">
            {kpis.unpaid_available_formatted}
          </div>
          <div className="mt-1 text-xs text-content-secondary">
            ≈ {kpis.unpaid_available_iqd.toLocaleString()} IQD
          </div>
        </div>

        {onRequestPayoutClick && (
          <div className="mt-4 pt-3 border-t border-border-subtle">
            <button
              onClick={onRequestPayoutClick}
              disabled={!isEligibleForPayout}
              className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                isEligibleForPayout
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                  : 'bg-surface-secondary text-content-muted cursor-not-allowed border border-border-subtle'
              }`}
              type="button"
            >
              <span>{t('requestPayout')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Pending Maturation Balance */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
              {t('unpaidPending')}
            </span>
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-content-primary tracking-tight">
            {kpis.unpaid_pending_formatted}
          </div>
          <div className="mt-1 text-xs text-content-secondary">
            24h maturation hold
          </div>
        </div>
      </div>

      {/* 3. Total Earned / Withdrawn */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
              {t('totalEarned')}
            </span>
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-content-primary tracking-tight">
            {kpis.total_earned_formatted}
          </div>
          <div className="mt-1 text-xs text-content-secondary">
            {t('totalWithdrawn')}: {kpis.total_withdrawn_formatted}
          </div>
        </div>
      </div>

      {/* 4. Referred Orders & Co-Prize Tickets */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
              {t('coPrizeTickets')}
            </span>
            <Ticket className="w-6 h-6 text-accent-gold" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-content-primary tracking-tight">
            {kpis.active_co_prize_tickets_count}
          </div>
          <div className="mt-1 text-xs text-content-secondary">
            {kpis.total_referred_orders_count} {t('referredOrders')}
          </div>
        </div>
      </div>
    </div>
  );
}
