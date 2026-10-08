'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { BookOpen, CheckCircle, Ticket, Sparkles, Loader2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useLearnerDashboard, EnrolledCourseItem } from '@/hooks/useLearnerDashboard';
import { useSiteWideCms } from '@/hooks/admin/useAdminCms';
import { JumpBackInHero } from './JumpBackInHero';
import { EnrolledCourseCard } from './EnrolledCourseCard';
import CheckoutBottomSheet, { CheckoutItemData } from '@/components/checkout/CheckoutBottomSheet';

export function LearnerDashboardView() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const isAr = locale === 'ar';

  const { data: cmsData } = useSiteWideCms();
  const learnerCms = cmsData?.sections?.learner_dashboard;

  const {
    summary,
    activeLearning,
    enrolledCourses,
    isEmpty,
    isLoading,
    isError,
    error,
    isUnauthenticated,
    refetch,
  } = useLearnerDashboard();

  // Ensure fresh authoritative enrollments on every mount of the dashboard
  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const [checkoutItem, setCheckoutItem] = useState<CheckoutItemData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleUpgradeClick = (course: EnrolledCourseItem) => {
    setCheckoutItem({
      courseId: course.course_id,
      courseTitle: isRtl ? course.title_ar : course.title_en,
      itemType: 'bundle',
      priceCents: 1000,
      promotionalTickets: 15,
      displayPriceLabel: '13,000 IQD',
    });
    setIsCheckoutOpen(true);
  };

  // State 1: Unauthenticated
  if (isUnauthenticated) {
    const unauthTitle =
      (isAr ? learnerCms?.unauthenticated_title_ar : learnerCms?.unauthenticated_title_en) ||
      (isRtl ? 'تسجيل الدخول إلى لوحة التدريب' : 'Sign In to Your Learning Hub');

    const unauthDesc =
      (isAr ? learnerCms?.unauthenticated_desc_ar : learnerCms?.unauthenticated_desc_en) ||
      (isRtl
        ? 'سجّل الدخول للوصول إلى دوراتك المهنية المشتركة، ومتابعة تقدمك العملي، وتذاكر السحب المكتسبة.'
        : 'Sign in to access your enrolled vocational courses, continue learning, and view your promotional tickets.');

    return (
      <div className="max-w-2xl mx-auto my-16 p-8 rounded-3xl bg-surface border border-border-subtle text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-content-primary">
          {unauthTitle}
        </h2>
        <p className="mt-2 text-sm text-content-secondary max-w-md mx-auto">
          {unauthDesc}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth/login?redirect=/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-all shadow-xs"
          >
            <span>{isRtl ? 'تسجيل الدخول إلى حسابك' : 'Sign in to Your Account'}</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-surface-secondary hover:bg-surface-elevated text-content-secondary text-sm font-semibold transition-colors border border-border-subtle"
          >
            {isRtl ? 'تصفح الدورات' : 'Browse Courses'}
          </Link>
        </div>
      </div>
    );
  }

  // State 2: Loading Skeleton
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-surface-secondary rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-28 bg-surface-secondary rounded-2xl" />
          <div className="h-28 bg-surface-secondary rounded-2xl" />
          <div className="h-28 bg-surface-secondary rounded-2xl" />
        </div>
        <div className="h-64 bg-surface-secondary rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-surface-secondary rounded-2xl" />
          <div className="h-80 bg-surface-secondary rounded-2xl" />
        </div>
      </div>
    );
  }

  // State 3: Error
  if (isError) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-500/30 text-center">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h3 className="font-bold text-base text-red-900 dark:text-red-200">
          {isRtl ? 'تعذر تحميل لوحة التدريب' : 'Unable to Load Learning Hub'}
        </h3>
        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
          {error?.message || (isRtl ? 'حدث خطأ غير متوقع في جلب بياناتك.' : 'An error occurred fetching your dashboard.')}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
        >
          {isRtl ? 'إعادة المحاولة' : 'Try Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
            {(isAr ? learnerCms?.welcome_title_ar : learnerCms?.welcome_title_en) ||
              (isRtl ? 'لوحة تدريبي ودوراتي' : 'My Learning Hub')}
          </h1>
          <p className="mt-1 text-sm text-content-secondary font-medium">
            {(isAr ? learnerCms?.welcome_subtitle_ar : learnerCms?.welcome_subtitle_en) ||
              (isRtl
                ? 'متابعة مسارك المهني، إنجاز الورش، والتذاكر الترويجية المكتسبة'
                : 'Track your vocational curriculum, workshop completions, and earned raffle tickets')}
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-secondary hover:bg-surface-elevated text-content-secondary hover:text-content-primary text-xs font-semibold transition-colors border border-border-subtle shrink-0"
        >
          <span>{isRtl ? 'دليل الدورات المهنية' : 'Browse Catalog'}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Enrolled Courses */}
        <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-content-primary block leading-none">
              {summary.enrolled_courses_count}
            </span>
            <span className="text-xs text-content-muted font-medium mt-1 block">
              {isRtl ? 'دورات مهنية مشترك بها' : 'Enrolled Courses'}
            </span>
          </div>
        </div>

        {/* Metric 2: Completed Courses */}
        <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-content-primary block leading-none">
              {summary.completed_courses_count}
            </span>
            <span className="text-xs text-content-muted font-medium mt-1 block">
              {isRtl ? 'دورات مكتملة بالكامل' : 'Completed Courses'}
            </span>
          </div>
        </div>

        {/* Metric 3: Total Tickets */}
        <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-content-primary block leading-none">
              {summary.total_tickets_count}
            </span>
            <span className="text-xs text-content-muted font-medium mt-1 block">
              {isRtl ? 'تذاكر سحب ترويجية نشطة' : 'Active Raffle Tickets'}
            </span>
          </div>
        </div>
      </div>

      {/* Jump Back In Continuation Hero */}
      {activeLearning && (
        <section aria-labelledby="jump-back-in-heading">
          <JumpBackInHero item={activeLearning} />
        </section>
      )}

      {/* Enrolled Courses Section */}
      <section aria-labelledby="enrolled-courses-heading" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 id="enrolled-courses-heading" className="text-lg sm:text-xl font-bold text-content-primary tracking-tight">
            {isRtl ? 'مناهجي التدريبية' : 'My Courses'}
          </h2>
          <span className="text-xs text-content-muted font-medium">
            {isRtl ? `${enrolledCourses.length} دورات` : `${enrolledCourses.length} Courses`}
          </span>
        </div>

        {isEmpty ? (
          /* Empty State */
          <div className="p-10 rounded-3xl bg-surface border border-dashed border-border-subtle text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-content-primary">
                {(isAr ? learnerCms?.empty_headline_ar : learnerCms?.empty_headline_en) ||
                  (isRtl ? 'لم تشترك في أي دورة مهنية بعد' : 'No Enrolled Courses Yet')}
              </h3>
              <p className="mt-1 text-xs text-content-secondary">
                {(isAr ? learnerCms?.empty_desc_ar : learnerCms?.empty_desc_en) ||
                  (isRtl
                    ? 'ابدأ باكتساب مهارات عملية من سوق العمل بـ 2$ فقط للجزء أو 10$ للحقيبة كاملة واحصل على تذاكر سحب مجانية.'
                    : 'Start learning practical trade skills for $2 per part or $10 for a full bundle with free bonus tickets.')}
              </p>
            </div>
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-xs"
              >
                <span>
                  {(isAr ? learnerCms?.empty_cta_label_ar : learnerCms?.empty_cta_label_en) ||
                    (isRtl ? 'استكشف دليل الدورات' : 'Explore Courses')}
                </span>
              </Link>
            </div>
          </div>
        ) : (
          /* Grid of Enrolled Courses */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((c) => (
              <EnrolledCourseCard
                key={c.course_id}
                course={c}
                onUpgradeClick={handleUpgradeClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* Upgrade Checkout Bottom Sheet */}
      {checkoutItem && (
        <CheckoutBottomSheet
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false);
            refetch();
          }}
          item={checkoutItem}
        />
      )}
    </div>
  );
}
