'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api-client';
import { CourseData } from '@/components/catalog/CourseCard';
import CoursePartList, { CoursePartData } from '@/components/catalog/CoursePartList';
import CheckoutBottomSheet, { CheckoutItemData } from '@/components/checkout/CheckoutBottomSheet';
import { LearningOutcomes } from '@/components/course/LearningOutcomes';
import { CourseProgressBar } from '@/components/course/CourseProgressBar';
import { useCourseDetail } from '@/hooks/useCatalog';
import { Loader2, AlertCircle, Ticket, ArrowRight, Check } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = useLocale();
  const t = useTranslations('catalog');
  const tCommon = useTranslations('common');

  const [checkoutItem, setCheckoutItem] = useState<CheckoutItemData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const {
    data: course,
    isLoading,
    isError,
    error,
  } = useCourseDetail(slug);

  // State 1: Loading
  if (isLoading) {
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
          لم يتم العثور على الدورة المطلوبة
        </h2>
        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
          {(error as any)?.message || 'تأكد من صحة الرابط أو تصفح باقي الدورات المتاحة.'}
        </p>
        <div className="mt-5">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            تصفح دليل الدورات
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
          <span>العودة لجميع الدورات</span>
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
              <span>شامل 6 أجزاء تدريبية مصورة</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-success" />
              <span>ملفات عمل ومخططات قابلة للتحميل</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-success" />
              <span>دخول فوري مدى الحياة بدون اشتراك</span>
            </span>
          </div>
        </div>

        {/* Full Bundle Purchase Card (1 col) - Preserving white background requirement */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-border-subtle text-content-primary space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary">
              {t('bundleOffer')}
            </span>
            <span className="text-accent text-xs font-semibold flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5" />
              <span>{course.bundle_promotional_tickets} تذكرة</span>
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-content-primary">
                ${(course.bundle_price_cents / 100).toFixed(2)}
              </span>
              <span className="text-xs text-content-muted">
                ({course.display_price_label})
              </span>
            </div>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {t('bundleSavings')}
            </p>
          </div>

          <button
            onClick={handleBundleCheckout}
            className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
          >
            <span>{t('buyBundle')}</span>
          </button>

          <p className="text-[11px] text-content-muted text-center leading-relaxed">
            يشمل جميع الأجزاء الـ 6 كاملة + 15 تذكرة سحب ترويجية مجانية على الجوائز الكبرى.
          </p>
        </div>
      </div>

      {/* What You'll Learn: Vocational Outcomes Panel */}
      <LearningOutcomes slug={slug} />

      {/* Curriculum Syllabus & Modular Parts Explorer */}
      <div className="pt-2">
        <CoursePartList
          courseId={course.id}
          courseTitle={title}
          courseSlug={course.slug}
          parts={course.parts || []}
          onSelectPart={handlePartCheckout}
        />
      </div>

      {/* Sticky Bottom Progress & Buy Bar */}
      <CourseProgressBar
        courseTitle={title}
        bundlePriceUsd={course.bundle_price_cents / 100}
        promotionalTickets={course.bundle_promotional_tickets}
        onBuyBundle={handleBundleCheckout}
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
