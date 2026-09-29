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
import { Loader2, AlertCircle, Ticket, Sparkles, ArrowRight, ShieldCheck, Check } from 'lucide-react';
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
        <div className="lg:col-span-2 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-light/60 dark:bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>منهج مهني تدريبي معتمد</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-secondary dark:text-white leading-tight">
            {title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {description}
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-success" />
              <span>شامل 6 أجزاء تدريبية مصورة</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-success" />
              <span>ملفات عمل ومخططات قابلة للتحميل</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-success" />
              <span>دخول فوري مدى الحياة بدون اشتراك شهري</span>
            </span>
          </div>
        </div>

        {/* Full Bundle Purchase Card (1 col) */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-secondary to-secondary-surface text-white shadow-xl border border-secondary-surface space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary-light uppercase tracking-wider">
              {t('bundleOffer')}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 text-xs font-black flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5" />
              <span>{course.bundle_promotional_tickets} تذكرة</span>
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">
                ${(course.bundle_price_cents / 100).toFixed(2)}
              </span>
              <span className="text-sm font-semibold text-primary-light">
                ({course.display_price_label})
              </span>
            </div>
            <p className="mt-1 text-xs text-success font-semibold">
              {t('bundleSavings')}
            </p>
          </div>

          <button
            onClick={handleBundleCheckout}
            className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-extrabold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span>{t('buyBundle')}</span>
          </button>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
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
