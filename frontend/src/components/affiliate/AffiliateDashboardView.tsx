'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Users, Loader2, AlertCircle, ShoppingBag, ShieldCheck, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { useAffiliateDashboard } from '@/hooks/useAffiliateDashboard';
import { useAffiliateLedger, LedgerEntryType } from '@/hooks/useAffiliateLedger';
import { useSiteWideCms } from '@/hooks/admin/useAdminCms';
import { AffiliateKpiCards } from './AffiliateKpiCards';
import { ReferralLinkCard } from './ReferralLinkCard';
import { AffiliateLedgerTable } from './AffiliateLedgerTable';
import { PayoutRequestModal } from './PayoutRequestModal';
import { getApiBaseUrl } from '@/lib/api-client';

interface AffiliateDashboardViewProps {
  onOpenPayoutModal?: () => void;
}

export function AffiliateDashboardView({ onOpenPayoutModal }: AffiliateDashboardViewProps) {
  const t = useTranslations('affiliate');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const isAr = locale === 'ar';

  const { data: cmsData } = useSiteWideCms();
  const affPortal = cmsData?.sections?.affiliate_portal;

  const {
    referralInfo,
    kpis,
    commissionPolicy,
    recentConversions,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
    isUnauthenticated,
    refetch: refetchDashboard,
  } = useAffiliateDashboard();

  const activeRatePercent =
    commissionPolicy?.sales_commission_rate_percent ?? 25;

  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerType, setLedgerType] = useState<LedgerEntryType>('all');
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  const {
    entries: ledgerEntries,
    pagination: ledgerPagination,
    isLoading: isLedgerLoading,
    refetch: refetchLedger,
  } = useAffiliateLedger({
    page: ledgerPage,
    type: ledgerType,
  });

  // State 1: Unauthenticated Guard
  if (isUnauthenticated) {
    const backendUrl = getApiBaseUrl();

    const onboardingTitle =
      (isAr ? affPortal?.onboarding_title_ar : affPortal?.onboarding_title_en) ||
      (isRtl ? 'تسجيل الدخول إلى بوابة الشركاء والمسوّقين' : 'Sign In to Your Affiliate Portal');

    const onboardingDesc =
      (isAr ? affPortal?.onboarding_desc_ar : affPortal?.onboarding_desc_en) ||
      (isRtl
        ? `سجّل الدخول للحصول على رابط الإحالة الخاص بك، ومتابعة عمولات المبيعات (${activeRatePercent}%)، ومكافأة الفوز بالجائزة الكبرى (40%).`
        : `Sign in to access your unique referral link, track ${activeRatePercent}% sales commissions, and claim 40% co-prize rewards.`);

    return (
      <div className="max-w-2xl mx-auto my-16 p-8 rounded-3xl bg-surface border border-border-subtle text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-content-primary">
          {onboardingTitle}
        </h2>
        <p className="mt-2 text-sm text-content-secondary max-w-md mx-auto">
          {onboardingDesc}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth/login?redirect=/affiliate"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>{isRtl ? 'تسجيل الدخول / حساب جديد' : 'Sign In / Register'}</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-surface-secondary hover:bg-surface-elevated text-content-secondary text-sm font-semibold transition-colors border border-border-subtle"
          >
            {isRtl ? 'الرئيسية' : 'Home'}
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 pt-6 border-t border-border-subtle text-start">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                Dev Personas
              </span>
              <span className="text-[11px] text-content-secondary">
                {isRtl ? 'بيئة التطوير المحلية' : 'Local Dev Mode'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={`${backendUrl}/auth/google/redirect?mock_email=affiliate_a@test.knzin.com`}
                className="flex items-center justify-between p-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-xs"
              >
                <div>
                  <div className="font-bold text-content-primary">
                    {isRtl ? 'المسوّق أ (Affiliate A)' : 'Affiliate A'}
                  </div>
                  <div className="text-[11px] font-mono text-content-secondary">
                    affiliate_a@test.knzin.com
                  </div>
                </div>
                <span className="text-primary font-bold">→</span>
              </a>
              <a
                href={`${backendUrl}/auth/google/redirect?mock_email=customer_b@test.knzin.com`}
                className="flex items-center justify-between p-2.5 rounded-xl border border-border-subtle bg-surface-secondary hover:bg-surface-elevated transition-colors text-xs"
              >
                <div>
                  <div className="font-bold text-content-primary">
                    {isRtl ? 'العميل ب (Customer B)' : 'Customer B'}
                  </div>
                  <div className="text-[11px] font-mono text-content-secondary">
                    customer_b@test.knzin.com
                  </div>
                </div>
                <span className="text-content-secondary font-bold">→</span>
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // State 2: Loading State
  if (isDashboardLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium text-content-secondary">
          {isRtl ? 'جاري تحميل بيانات الشركاء...' : 'Loading affiliate data...'}
        </p>
      </div>
    );
  }

  // State 3: Error State
  if (isDashboardError) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-rose-700 dark:text-rose-400">
          {isRtl ? 'تعذر تحميل بيانات الشركاء' : 'Failed to load affiliate dashboard'}
        </h3>
        <p className="text-xs text-rose-600/80 mt-1">
          {dashboardError?.message || (isRtl ? 'حدث خطأ في الاتصال بالخادم.' : 'A server error occurred.')}
        </p>
        <button
          onClick={() => refetchDashboard()}
          className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
          type="button"
        >
          {isRtl ? 'إعادة المحاولة' : 'Try Again'}
        </button>
      </div>
    );
  }

  const activeMinPayoutFormatted = commissionPolicy?.minimum_payout_formatted || '$50.00';

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header & Program Vision */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRtl ? 'برنامج شركاء كنزيْن الرسمي' : 'Official KNZiN Partner Program'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-content-primary tracking-tight">
            {(isAr ? affPortal?.banner_title_ar : affPortal?.banner_title_en) || t('title')}
          </h1>
          <p className="text-sm text-content-secondary mt-1 max-w-2xl">
            {(isAr ? affPortal?.banner_subtitle_ar : affPortal?.banner_subtitle_en) || t('subtitle', { rate: `${activeRatePercent}%` })}
          </p>
        </div>

        {/* Dynamic Admin Policy Notice Banner */}
        <div className="bg-surface-secondary border border-border-subtle rounded-2xl p-4 flex items-start gap-3 max-w-md">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-xs text-content-secondary">
            <span className="font-semibold text-content-primary block mb-0.5">
              {(isAr ? affPortal?.policy_notice_title_ar : affPortal?.policy_notice_title_en) || (isRtl ? 'سياسة السحب والامتثال' : 'Active Withdrawal Policy')}
            </span>
            <p>
              {(isAr ? affPortal?.policy_notice_text_ar : affPortal?.policy_notice_text_en) || t('minimumThresholdNotice', { amount: activeMinPayoutFormatted })}
            </p>
          </div>
        </div>
      </div>

      {/* Co-Prize 40% Partner Rules Presentation (Feature 006) */}
      {affPortal && affPortal.is_visible !== false && (
        <div className="p-5 rounded-2xl bg-brand-gold/10 border border-brand-gold/25 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-brand-gold/20 text-brand-gold shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? affPortal.coprize_rules_title_ar : affPortal.coprize_rules_title_en}
            </h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              {isAr ? affPortal.coprize_rules_desc_ar : affPortal.coprize_rules_desc_en}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {kpis && (
        <AffiliateKpiCards
          kpis={kpis}
          minimumPayoutCents={commissionPolicy?.minimum_payout_cents}
          onRequestPayoutClick={onOpenPayoutModal || (() => setIsPayoutModalOpen(true))}
        />
      )}

      {/* Link Generator & Referral Tools */}
      {referralInfo && (
        <ReferralLinkCard referralInfo={referralInfo} />
      )}

      {/* Recent Conversions (if any) */}
      {recentConversions.length > 0 && (
        <div className="bg-surface border border-border-subtle rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-content-primary">
              {isRtl ? 'أحدث المبيعات المكتسبة من إحالاتك' : 'Recent Referred Conversions'}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentConversions.map((conv) => (
              <div
                key={conv.order_number}
                className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-content-secondary mb-1">
                    <span className="font-mono">{conv.order_number}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      +{conv.commission_formatted}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-content-primary line-clamp-1">
                    {isRtl ? conv.course_title_ar : conv.course_title_en}
                  </h4>
                  <div className="mt-1 text-xs text-content-secondary">
                    {isRtl ? 'المشتري' : 'Buyer'}: {conv.buyer_name}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-border-subtle/50 flex items-center justify-between text-xs text-content-muted">
                  <span>
                    {conv.tickets_granted_to_buyer}{' '}
                    {isRtl ? 'تذكرة ممنوحة للمشتري' : 'tickets granted to buyer'}
                  </span>
                  {conv.status === 'available' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isRtl ? 'متاحة للسحب' : 'Available'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                      <Clock className="w-3 h-3" />
                      <span>{isRtl ? 'قيد الحجز (24 س)' : 'Pending (24h)'}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paginated Append-Only Ledger Table */}
      <AffiliateLedgerTable
        entries={ledgerEntries}
        pagination={ledgerPagination}
        onPageChange={(page) => setLedgerPage(page)}
        onTypeFilterChange={(type) => {
          setLedgerType(type);
          setLedgerPage(1);
        }}
        selectedType={ledgerType}
        isLoading={isLedgerLoading}
      />

      {/* Payout Withdrawal Request Modal */}
      {kpis && (
        <PayoutRequestModal
          isOpen={isPayoutModalOpen}
          onClose={() => setIsPayoutModalOpen(false)}
          unpaidAvailableCents={kpis.unpaid_available_cents}
          minimumPayoutCents={commissionPolicy?.minimum_payout_cents || 5000}
          minimumPayoutFormatted={commissionPolicy?.minimum_payout_formatted || '$50.00'}
        />
      )}
    </div>
  );
}
