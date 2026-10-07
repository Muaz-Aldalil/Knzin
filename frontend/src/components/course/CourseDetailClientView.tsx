'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { DetailedCourse, useCourseDetail } from '@/hooks/useCatalog';
import CoursePartList from '@/components/catalog/CoursePartList';
import CheckoutBottomSheet, { CheckoutItemData } from '@/components/checkout/CheckoutBottomSheet';
import { LearningOutcomes } from '@/components/course/LearningOutcomes';
import { CourseProgressBar } from '@/components/course/CourseProgressBar';
import { fetchCourseProgress } from '@/lib/progress';
import { Loader2, AlertCircle, Ticket, ArrowRight, Check, ShieldCheck, PlayCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useSiteWideCms } from '@/hooks/admin/useAdminCms';
import { useLearnerDashboard } from '@/hooks/useLearnerDashboard';

interface CourseDetailClientViewProps {
  slug: string;
  initialCourse: DetailedCourse | null;
}

export default function CourseDetailClientView({ slug, initialCourse }: CourseDetailClientViewProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const t = useTranslations('catalog');
  const tCommon = useTranslations('common');
  const { data: cmsData } = useSiteWideCms();
  const courseDetail = cmsData?.sections?.course_detail;

  const [checkoutItem, setCheckoutItem] = useState<CheckoutItemData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [studentProgress, setStudentProgress] = useState<number>(0);

  const {
    data: course,
    isLoading,
    isError,
    error,
  } = useCourseDetail(slug, initialCourse || undefined);

  const { enrolledCourses } = useLearnerDashboard();
  const currentEnrolled = enrolledCourses.find((c) => c.slug === slug || c.course_id === course?.id);
  const isBundleEnrolled = currentEnrolled?.entitlement_type === 'bundle';

  React.useEffect(() => {
    let mounted = true;
    fetchCourseProgress(slug).then((progressMap) => {
      if (mounted && progressMap) {
        const partsCount = course?.parts?.length || course?.parts_count || 1;
        const completedParts = Object.values(progressMap).filter((p) => p.is_completed).length;
        const currentPart = Object.values(progressMap).find((p) => !p.is_completed && p.percent_complete > 0);
        const inProgressContribution = currentPart ? (currentPart.percent_complete / 100) : 0;
        const total = Math.round(((completedParts + inProgressContribution) / partsCount) * 100);
        setStudentProgress(Math.min(100, Math.max(0, total)));
      }
    });
    return () => {
      mounted = false;
    };
  }, [slug, course]);

  // Restore pending checkout after returning from login
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && course?.id) {
        const pending = sessionStorage.getItem('knzin_pending_checkout');
        if (pending) {
          const item = JSON.parse(pending);
          if (item.courseId === course.id) {
            sessionStorage.removeItem('knzin_pending_checkout');
            setCheckoutItem(item);
            setIsCheckoutOpen(true);
          }
        }
      }
    } catch {}
  }, [course?.id]);

  // State 1: Loading (only when no initialCourse is available)
  if (isLoading && !course) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold">{tCommon('loading')}</p>
      </div>
    );
  }

  // State 2: Error
  if (isError || !course) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-500/30 text-center">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h2 className="text-base font-bold text-red-900 dark:text-red-200">
          {locale === 'ar' ? 'لم يتم العثور على الدورة المطلوبة' : 'Course Not Found'}
        </h2>
        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
          {(error as any)?.message || (locale === 'ar' ? 'تأكد من صحة الرابط أو تصفح باقي الدورات المتاحة.' : 'Please verify the link or browse our available courses.')}
        </p>
        <div className="mt-5">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            {locale === 'ar' ? 'تصفح دليل الدورات' : 'Browse Course Catalog'}
          </Link>
        </div>
      </div>
    );
  }

  // State 3: Success
  const title = locale === 'ar' ? course.title_ar : course.title_en;
  const description = locale === 'ar' ? course.description_ar : course.description_en;

  const handleBundleCheckout = () => {
    setCheckoutItem({
      courseId: course.id,
      courseTitle: title,
      itemType: 'bundle',
      priceCents: course.bundle_price_cents,
      promotionalTickets: course.bundle_promotional_tickets,
      displayPriceLabel: course.display_price_label,
    });
    setIsCheckoutOpen(true);
  };

  const handlePartCheckout = (item: CheckoutItemData) => {
    setCheckoutItem(item);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Back Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
          <span>{locale === 'ar' ? 'العودة لجميع الدورات' : 'Back to all courses'}</span>
        </Link>
      </div>

      {/* Hero Header & Bundle Feature Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Course Info (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-content-primary tracking-tight leading-tight">
            {title}
          </h1>

          <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
            {description}
          </p>

          <div className="pt-1 flex flex-wrap gap-4 text-xs text-content-secondary">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-success" />
              <span>
                {locale === 'ar'
                  ? `شامل ${course.parts?.length || course.parts_count || 6} أجزاء تدريبية مصورة`
                  : `Includes ${course.parts?.length || course.parts_count || 6} video modules`}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-success" />
              <span>
                {locale === 'ar' ? 'ملفات عمل ومخططات قابلة للتحميل' : 'Downloadable schematics & workbooks'}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-success" />
              <span>
                {locale === 'ar' ? 'دخول فوري مدى الحياة بدون اشتراك' : 'Instant lifetime access without subscription'}
              </span>
            </span>
          </div>

          {/* CMS Golden Guarantee Banner */}
          {courseDetail && courseDetail.is_visible !== false && (
            <div className="p-4 rounded-xl bg-brand-gold/10 border border-brand-gold/25 flex items-start gap-3 mt-4">
              <ShieldCheck className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold">
                    {isAr ? courseDetail.guarantee_badge_ar : courseDetail.guarantee_badge_en}
                  </span>
                  <span className="text-xs font-bold text-content-primary">
                    {isAr ? courseDetail.guarantee_headline_ar : courseDetail.guarantee_headline_en}
                  </span>
                </div>
                <p className="text-xs text-content-secondary leading-relaxed">
                  {isAr ? courseDetail.guarantee_description_ar : courseDetail.guarantee_description_en}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Full Bundle Purchase Card or Enrolled State Card */}
        {isBundleEnrolled ? (
          <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-500/40 text-content-primary space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'أنت مشترك في الحقيبة الكاملة' : 'Full Bundle Enrolled'}</span>
              </span>
              <span className="text-accent text-xs font-semibold flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" />
                <span>{course.bundle_promotional_tickets} {tCommon('ticket')}</span>
              </span>
            </div>

            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isAr ? 'تم تفعيل جميع الأجزاء وتذاكر السحب' : 'All Parts & Tickets Unlocked'}
              </h4>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isAr
                  ? `أنت مؤهل للدخول لجميع الأجزاء الـ ${course.parts?.length || course.parts_count || 6} كاملة مع رصيد تذاكر السحب الترويجية النشطة.`
                  : `You have full access to all ${course.parts?.length || course.parts_count || 6} parts and active sweepstakes tickets.`}
              </p>
            </div>

            <Link
              href={`/lessons/${course.slug}?part=1`}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{isAr ? 'بدء المشاهدة والتدريب الآن' : 'Start Watching Now'}</span>
            </Link>
          </div>
        ) : (
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-border-subtle text-content-primary space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary">
                {(isAr ? courseDetail?.bundle_promo_badge_ar : courseDetail?.bundle_promo_badge_en) || t('bundleOffer')}
              </span>
              <span className="text-accent text-xs font-semibold flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" />
                <span>{course.bundle_promotional_tickets} {tCommon('ticket')}</span>
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <bdi className="text-2xl sm:text-3xl font-extrabold text-content-primary">
                  ${(course.bundle_price_cents / 100).toFixed(2)}
                </bdi>
                <bdi className="text-xs text-content-muted">
                  ({course.display_price_label})
                </bdi>
              </div>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {(isAr ? courseDetail?.bundle_promo_title_ar : courseDetail?.bundle_promo_title_en) || t('bundleSavings')}
              </p>
            </div>

            <button
              onClick={handleBundleCheckout}
              className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
            >
              <span>{t('buyBundle')}</span>
            </button>

            <p className="text-[11px] text-content-muted text-center leading-relaxed">
              {(isAr ? courseDetail?.bundle_promo_desc_ar : courseDetail?.bundle_promo_desc_en) ||
                (locale === 'ar'
                  ? `يشمل جميع الأجزاء الـ ${course.parts?.length || course.parts_count || 6} كاملة + ${course.bundle_promotional_tickets} تذكرة سحب ترويجية مجانية على الجوائز الكبرى.`
                  : `Includes all ${course.parts?.length || course.parts_count || 6} parts + ${course.bundle_promotional_tickets} free promotional raffle tickets.`)}
            </p>
          </div>
        )}
      </div>

      {/* What You'll Learn: Vocational Outcomes Panel */}
      <LearningOutcomes
        slug={slug}
        titleAr={course.title_ar}
        outcomes={
          course.outcomes && course.outcomes.length > 0
            ? course.outcomes.map((o: any) => ({
                title: locale === 'ar' ? (o.title_ar || o.title) : (o.title_en || o.title || o.title_ar),
                description: locale === 'ar' ? (o.desc_ar || o.description) : (o.desc_en || o.description || o.desc_ar),
                icon: o.icon || 'wrench',
              }))
            : undefined
        }
      />

      {/* Curriculum Syllabus & Modular Parts Explorer */}
      <div className="pt-2">
        <CoursePartList
          courseId={course.id}
          courseTitle={title}
          courseSlug={course.slug}
          parts={course.parts || []}
          onSelectPart={handlePartCheckout}
          isCourseEnrolled={isBundleEnrolled}
        />
      </div>

      {/* Sticky Bottom Progress & Buy Bar */}
      <CourseProgressBar
        courseTitle={title}
        courseSlug={course.slug}
        percentComplete={studentProgress}
        bundlePriceUsd={course.bundle_price_cents / 100}
        promotionalTickets={course.bundle_promotional_tickets}
        onBuyBundle={handleBundleCheckout}
        isEnrolled={isBundleEnrolled}
      />

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
