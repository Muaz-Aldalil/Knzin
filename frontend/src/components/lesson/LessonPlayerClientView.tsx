'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { DetailedCourse, useCourseDetail } from '@/hooks/useCatalog';
import { getLessonContent } from '@/lib/course-content';
import { LessonHeader } from '@/components/lesson/LessonHeader';
import { LessonVideoPlayer } from '@/components/lesson/LessonVideoPlayer';
import { LessonTabs } from '@/components/lesson/LessonTabs';
import { LessonSidebar, SidebarPartItem } from '@/components/lesson/LessonSidebar';
import { LessonFooterNav } from '@/components/lesson/LessonFooterNav';
import CheckoutBottomSheet, { CheckoutItemData } from '@/components/checkout/CheckoutBottomSheet';
import { Loader2, AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface LessonPlayerClientViewProps {
  slug: string;
  initialCourse: DetailedCourse | null;
}

function LessonPlayerContent({ slug, initialCourse }: LessonPlayerClientViewProps) {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('catalog');
  const tCommon = useTranslations('common');

  // URL state
  const partNumber = parseInt(searchParams.get('part') || '1', 10);
  const startSeconds = parseInt(searchParams.get('t') || '0', 10);

  // Checkout modal state
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItemData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Track purchased parts in session (Part 1 is free preview by default)
  const [purchasedParts, setPurchasedParts] = useState<Set<number>>(new Set([1]));

  const { data: course, isLoading, isError, error } = useCourseDetail(
    slug,
    initialCourse || undefined
  );

  // State 1: Loading (only when no initialCourse is present)
  if (isLoading && !course) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
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
          لم يتم العثور على الدرس المطلوب
        </h2>
        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
          {(error as any)?.message || 'تأكد من صحة الرابط أو تصفح باقي الدورات المهنية.'}
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

  const courseTitle = locale === 'ar' ? course.title_ar : course.title_en;
  const currentPartData = course.parts?.find((p) => p.part_number === partNumber) || course.parts?.[0];
  const extendedContent = getLessonContent(slug, partNumber);

  const partTitle = currentPartData
    ? locale === 'ar'
      ? currentPartData.title_ar
      : currentPartData.title_en
    : `الجزء ${partNumber}`;

  const summary = extendedContent
    ? locale === 'ar'
      ? extendedContent.summary_ar
      : extendedContent.summary_en
    : currentPartData
    ? locale === 'ar'
      ? currentPartData.syllabus_ar
      : currentPartData.syllabus_en
    : '';

  const keyPoints = extendedContent
    ? locale === 'ar'
      ? extendedContent.keyPoints_ar
      : extendedContent.keyPoints_en
    : [
        'إتقان المهارة المهنية الأساسية لهذا الجزء',
        'تطبيق معايير السلامة والجودة المعتمدة',
        'مخططات العمل وجداول القياسات العملية',
      ];

  const proTip = extendedContent
    ? locale === 'ar'
      ? extendedContent.proTip_ar
    : extendedContent.proTip_en
    : {
        title: 'نصيحة المهنة',
        content: 'التزم بإرشادات السلامة ودقة القياس لتفادي إتلاف المواد والمعدات في الورشة.',
      };

  const isUnlocked = purchasedParts.has(partNumber) || partNumber === 1;

  // Checkout Handlers
  const handleBuyPart = () => {
    if (!currentPartData) return;
    setCheckoutItem({
      courseId: course.id,
      courseTitle,
      itemType: 'part',
      partId: currentPartData.id,
      partNumber: currentPartData.part_number,
      partTitle,
      priceCents: currentPartData.part_price_cents,
      promotionalTickets: currentPartData.part_promotional_tickets,
      displayPriceLabel: currentPartData.display_price_label,
    });
    setIsCheckoutOpen(true);
  };

  const handleBuyBundle = () => {
    setCheckoutItem({
      courseId: course.id,
      courseTitle,
      itemType: 'bundle',
      priceCents: course.bundle_price_cents,
      promotionalTickets: course.bundle_promotional_tickets,
      displayPriceLabel: course.display_price_label,
    });
    setIsCheckoutOpen(true);
  };

  // Build sidebar items
  const sidebarParts: SidebarPartItem[] = (course.parts || []).map((p) => ({
    id: p.id,
    part_number: p.part_number,
    title: locale === 'ar' ? p.title_ar : p.title_en,
    duration_minutes: p.duration_minutes,
    isUnlocked: purchasedParts.has(p.part_number) || p.part_number === 1,
    isCompleted: p.part_number < partNumber,
  }));

  // Build Previous/Next navigation metadata
  const totalParts = course.parts?.length || 6;
  const previousPart =
    partNumber > 1
      ? {
          part_number: partNumber - 1,
          title:
            course.parts?.find((p) => p.part_number === partNumber - 1)
              ? locale === 'ar'
                ? course.parts.find((p) => p.part_number === partNumber - 1)!.title_ar
                : course.parts.find((p) => p.part_number === partNumber - 1)!.title_en
              : `الجزء ${partNumber - 1}`,
          duration_minutes:
            course.parts?.find((p) => p.part_number === partNumber - 1)?.duration_minutes || 45,
        }
      : null;

  const nextPart =
    partNumber < totalParts
      ? {
          part_number: partNumber + 1,
          title:
            course.parts?.find((p) => p.part_number === partNumber + 1)
              ? locale === 'ar'
                ? course.parts.find((p) => p.part_number === partNumber + 1)!.title_ar
                : course.parts.find((p) => p.part_number === partNumber + 1)!.title_en
              : `الجزء ${partNumber + 1}`,
          duration_minutes:
            course.parts?.find((p) => p.part_number === partNumber + 1)?.duration_minutes || 45,
        }
      : null;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <LessonHeader
        courseTitle={courseTitle}
        courseSlug={slug}
        partNumber={partNumber}
        partTitle={partTitle}
        summary={summary}
        durationMinutes={currentPartData?.duration_minutes || 45}
        promotionalTickets={currentPartData?.part_promotional_tickets || 1}
        isUnlocked={isUnlocked}
      />

      {/* Main Two-Column Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Left Column (Main Stage: Video + Tabs) */}
        <div className="flex-1 w-full space-y-6">
          <LessonVideoPlayer
            videoUrl={extendedContent?.videoUrl || 'https://www.youtube.com/watch?v=5VzYg8k9m0M'}
            durationSeconds={extendedContent?.duration_seconds || (currentPartData?.duration_minutes || 45) * 60}
            partNumber={partNumber}
            partTitle={partTitle}
            courseTitle={courseTitle}
            courseSlug={slug}
            isUnlocked={isUnlocked}
            startSeconds={startSeconds}
            nextPart={nextPart}
            onBuyPart={handleBuyPart}
            onBuyBundle={handleBuyBundle}
          />

          <LessonTabs
            summary={summary}
            keyPoints={keyPoints}
            proTip={proTip}
            resources={extendedContent?.resources || []}
            courseSlug={slug}
            partNumber={partNumber}
          />

          <LessonFooterNav
            courseSlug={slug}
            previousPart={previousPart}
            nextPart={nextPart}
          />
        </div>

        {/* Right Column (Curriculum Sidebar) */}
        <LessonSidebar
          courseTitle={courseTitle}
          courseSlug={slug}
          parts={sidebarParts}
          activePartNumber={partNumber}
          bundlePriceCents={course.bundle_price_cents}
          bundlePromotionalTickets={course.bundle_promotional_tickets}
          onBuyBundle={handleBuyBundle}
        />
      </div>

      {/* Checkout Bottom Sheet (Preserves Legal Shield & Anti-Piracy Quiz) */}
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

export default function LessonPlayerClientView({ slug, initialCourse }: LessonPlayerClientViewProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LessonPlayerContent slug={slug} initialCourse={initialCourse} />
    </Suspense>
  );
}
