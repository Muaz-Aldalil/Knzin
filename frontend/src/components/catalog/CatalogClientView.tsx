'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import CourseCard, { CourseData } from '@/components/catalog/CourseCard';
import CheckoutBottomSheet, { CheckoutItemData } from '@/components/checkout/CheckoutBottomSheet';
import { ResumeHeroCard } from '@/components/course/ResumeHeroCard';
import { HeroGrandPrizeCountdown } from '@/components/draws/HeroGrandPrizeCountdown';
import { TheHookSection } from '@/components/home/TheHookSection';
import { FaqAccordion } from '@/components/faq/FaqAccordion';
import { useCatalog } from '@/hooks/useCatalog';
import { usePublicLandingCms } from '@/hooks/admin/useAdminCms';
import { ContentUpdateNotification } from '@/components/common/ContentUpdateNotification';
import { sanitizeCtaUrl } from '@/lib/safe-url';
import {
  Loader2,
  AlertCircle,
  Sparkles,
  Gift,
  Users,
  BadgeDollarSign,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';

interface CatalogClientViewProps {
  initialCourses: CourseData[];
}

export default function CatalogClientView({ initialCourses }: CatalogClientViewProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const t = useTranslations('catalog');
  const tCommon = useTranslations('common');

  const [checkoutItem, setCheckoutItem] = useState<CheckoutItemData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // 1. Course Catalog Data
  const {
    courses,
    isLoading,
    isError,
    error,
    refetch,
  } = useCatalog(initialCourses);

  // 2. Authoritative Published CMS Content (with instantaneous fallback and Strategy 1 live notifications)
  const { data: cmsData, hasUpdate, applyUpdate, dismissUpdate } = usePublicLandingCms();
  const heroCms = cmsData?.sections?.hero;
  const bannerCms = cmsData?.sections?.promotional_banner;
  const referralCms = cmsData?.sections?.promotional_referral;
  const freeCardCms = cmsData?.sections?.free_referral_card;
  const ladderCms = cmsData?.sections?.ticket_ladder;
  const coursesCms = cmsData?.sections?.courses_display;

  const handleQuickCheckout = (item: CheckoutItemData) => {
    setCheckoutItem(item);
    setIsCheckoutOpen(true);
  };

  const heroBadge = isAr ? heroCms?.badge_ar : heroCms?.badge_en;
  const heroHeading = (isAr ? heroCms?.heading_ar : heroCms?.heading_en) || t('heading');
  const heroSubheading = (isAr ? heroCms?.subheading_ar : heroCms?.subheading_en) || t('subheading');

  return (
    <div className="space-y-10 pb-12 relative" data-testid="catalog-client-view">
      {/* Non-Disruptive Live Content Update Notification (Strategy 1) */}
      <ContentUpdateNotification
        hasUpdate={hasUpdate}
        onApply={applyUpdate}
        onDismiss={dismissUpdate}
      />
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto pt-6 sm:pt-10 space-y-4">
        {heroBadge && (
          <div className="inline-flex items-center gap-1.5 text-brand-gold text-xs font-bold tracking-wide mb-1 animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{heroBadge}</span>
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-content-primary tracking-tight leading-tight">
          {heroHeading}
        </h1>

        <p className="text-sm sm:text-base text-content-secondary max-w-xl mx-auto leading-relaxed">
          {heroSubheading}
        </p>

        {heroCms?.primary_cta_label_ar && (
          <div className="pt-2 flex items-center justify-center gap-3">
            <a
              href={sanitizeCtaUrl(heroCms.primary_cta_url, '#catalog')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-navy font-bold text-sm shadow-md transition-all"
            >
              <span>{isAr ? heroCms.primary_cta_label_ar : heroCms.primary_cta_label_en}</span>
              <Arrow className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {/* Promotional Grand Prize Banner (if enabled via CMS) */}
      {bannerCms?.is_visible && (
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-brand-gold/20 via-surface-elevated to-brand-gold/10 border border-brand-gold/30 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-start">
              <div className="inline-flex items-center gap-1.5 text-brand-gold text-xs font-bold">
                <Gift className="w-3.5 h-3.5" />
                <span>{isAr ? 'عرض ترويجي خاص' : 'Special Promotional Event'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-content-primary">
                {isAr ? bannerCms.headline_ar : bannerCms.headline_en}
              </h2>
              <p className="text-xs sm:text-sm text-content-secondary max-w-xl">
                {isAr ? bannerCms.subheadline_ar : bannerCms.subheadline_en}
              </p>
            </div>

            <a
              href={sanitizeCtaUrl(bannerCms.cta_url, '#catalog')}
              className="shrink-0 px-5 py-3 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-navy font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
            >
              <span>{isAr ? bannerCms.cta_label_ar : bannerCms.cta_label_en}</span>
              <Arrow className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Grand Prize Marquee Countdown Hero (Feature 003) */}
      <HeroGrandPrizeCountdown />

      {/* Scrimba-Style Resume & Continuation Hero Banner */}
      <ResumeHeroCard />

      {/* The Hook / Vision Narrative Experience (Feature 004 - User Story 2) */}
      <TheHookSection />

      {/* Promotional Ticket Ladder (if enabled via CMS) */}
      {ladderCms?.is_visible && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="p-6 rounded-3xl bg-surface border border-border-subtle shadow-md space-y-4">
            <div className="flex items-center gap-2.5">
              <BadgeDollarSign className="w-5 h-5 text-brand-gold" />
              <h2 className="font-bold text-content-primary text-base sm:text-lg">
                {isAr ? ladderCms.title_ar : ladderCms.title_en}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-surface-elevated border border-border-subtle/80 space-y-1">
                <span className="text-xs font-semibold text-content-secondary">
                  {isAr ? 'الأجزاء الفردية' : 'Individual Parts'}
                </span>
                <p className="text-sm font-bold text-content-primary">
                  {isAr ? ladderCms.part_rate_text_ar : ladderCms.part_rate_text_en}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 space-y-1">
                <span className="text-xs font-semibold text-brand-gold">
                  {isAr ? 'الباقة الكاملة' : 'Complete Course Bundle'}
                </span>
                <p className="text-sm font-bold text-brand-gold">
                  {isAr ? ladderCms.bundle_rate_text_ar : ladderCms.bundle_rate_text_en}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-content-muted leading-relaxed">
              {isAr ? ladderCms.disclaimer_ar : ladderCms.disclaimer_en}
            </p>
          </div>
        </div>
      )}

      {/* Promotional Referral & Free Referral Cards (if enabled via CMS) */}
      {(referralCms?.is_visible || freeCardCms?.is_visible) && (
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-5">
          {referralCms?.is_visible && (
            <div className="p-6 rounded-3xl bg-surface border border-border-subtle shadow-md flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-brand-gold">
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'برنامج الشركاء' : 'Partner Program'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-content-primary">
                  {isAr ? referralCms.title_ar : referralCms.title_en}
                </h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  {isAr ? referralCms.description_ar : referralCms.description_en}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className="text-xs font-bold text-emerald-500">
                    {isAr ? referralCms.commission_badge_ar : referralCms.commission_badge_en}
                  </span>
                  <span className="text-xs font-bold text-brand-gold">
                    {isAr ? referralCms.coprize_badge_ar : referralCms.coprize_badge_en}
                  </span>
                </div>
              </div>

              <Link
                href={`/${locale}${sanitizeCtaUrl(referralCms.cta_url, '/affiliate').startsWith('/') ? sanitizeCtaUrl(referralCms.cta_url, '/affiliate') : '/affiliate'}`}
                className="mt-3 inline-flex items-center justify-between w-full py-2.5 px-4 rounded-xl bg-surface-elevated hover:bg-surface border border-border-subtle text-xs font-bold text-content-primary transition-colors"
              >
                <span>{isAr ? referralCms.cta_label_ar : referralCms.cta_label_en}</span>
                <Arrow className="w-4 h-4 text-brand-gold" />
              </Link>
            </div>
          )}

          {freeCardCms?.is_visible && (
            <div className="p-6 rounded-3xl bg-surface border border-border-subtle shadow-md flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Gift className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isAr ? freeCardCms.badge_text_ar : freeCardCms.badge_text_en}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-content-primary">
                  {isAr ? freeCardCms.card_title_ar : freeCardCms.card_title_en}
                </h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  {isAr ? freeCardCms.card_text_ar : freeCardCms.card_text_en}
                </p>
              </div>

              <div className="p-3 text-center">
                <span className="text-xs font-bold text-primary">
                  {isAr ? 'شارك رابطك الشخصي الآن' : 'Share Your Referral Link Now'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Courses Display Title Header (CMS-customizable) */}
      {coursesCms?.is_visible !== false && (
        <div className="text-center max-w-2xl mx-auto pt-4 space-y-2">
          {coursesCms?.section_title_ar && (
            <h2 className="text-2xl font-bold text-content-primary">
              {isAr ? coursesCms.section_title_ar : coursesCms.section_title_en}
            </h2>
          )}
          {coursesCms?.section_subtitle_ar && (
            <p className="text-xs sm:text-sm text-content-secondary">
              {isAr ? coursesCms.section_subtitle_ar : coursesCms.section_subtitle_en}
            </p>
          )}
          {coursesCms?.show_bundle_discount_badge && coursesCms?.bundle_badge_text_ar && (
            <div className="inline-block mt-1">
              <span className="text-xs font-bold text-brand-gold">
                {isAr ? coursesCms.bundle_badge_text_ar : coursesCms.bundle_badge_text_en}
              </span>
            </div>
          )}
        </div>
      )}

      {/* State 1: Loading (only active if no initialCourses and still fetching) */}
      {isLoading && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-semibold">{tCommon('loading')}</p>
        </div>
      )}

      {/* State 2: Error */}
      {isError && (
        <div className="max-w-md mx-auto p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-500/30 text-center">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-red-900 dark:text-red-200">
            {tCommon('errorOccurred')}
          </h2>
          <p className="mt-1 text-xs text-red-700 dark:text-red-300">
            {(error as any)?.message || (locale === 'ar' ? 'تعذر تحميل قائمة الدورات. يرجى إعادة المحاولة.' : 'Failed to load courses. Please retry.')}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {tCommon('retry')}
          </button>
        </div>
      )}

      {/* State 3: Empty State */}
      {!isLoading && !isError && (!courses || courses.length === 0) && (
        <div className="text-center py-16 text-slate-500">
          <p className="text-sm font-semibold">{tCommon('emptyState')}</p>
        </div>
      )}

      {/* State 4: Courses Grid (Instant render from frame 1) */}
      {!isLoading && !isError && courses && courses.length > 0 && (
        <div id="catalog" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 scroll-mt-20">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onQuickCheckout={handleQuickCheckout}
            />
          ))}
        </div>
      )}

      {/* Public FAQ & Objection Handling Accordion (US4) */}
      <FaqAccordion />

      {/* Checkout Bottom Sheet */}
      {checkoutItem && (
        <CheckoutBottomSheet
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          item={checkoutItem}
        />
      )}
    </div>
  );
}
