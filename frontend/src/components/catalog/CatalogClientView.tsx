'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import CourseCard, { CourseData } from '@/components/catalog/CourseCard';
import CheckoutBottomSheet, { CheckoutItemData } from '@/components/checkout/CheckoutBottomSheet';
import { ResumeHeroCard } from '@/components/course/ResumeHeroCard';
import { useCatalog } from '@/hooks/useCatalog';
import { Loader2, AlertCircle, Search } from 'lucide-react';

interface CatalogClientViewProps {
  initialCourses: CourseData[];
}

export default function CatalogClientView({ initialCourses }: CatalogClientViewProps) {
  const t = useTranslations('catalog');
  const tCommon = useTranslations('common');

  const [checkoutItem, setCheckoutItem] = useState<CheckoutItemData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const {
    courses,
    isLoading,
    isError,
    error,
    refetch,
  } = useCatalog(initialCourses);

  const handleQuickCheckout = (item: CheckoutItemData) => {
    setCheckoutItem(item);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto pt-6 sm:pt-10 space-y-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-content-primary tracking-tight leading-tight">
          {t('heading')}
        </h1>

        <p className="text-sm sm:text-base text-content-secondary max-w-xl mx-auto leading-relaxed">
          {t('subheading')}
        </p>

        {/* Supabase-style In-Place Quick Search Trigger */}
        <div className="pt-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('knzin:open-search'))}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-primary hover:bg-surface-elevated border border-border-subtle hover:border-border text-content-muted hover:text-content-primary transition-colors group cursor-pointer text-start"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-content-muted group-hover:text-primary transition-colors" />
              <span className="text-xs sm:text-sm font-normal">
                ابحث في المهارات أو الأدوات أو الدروس...
              </span>
            </div>
            <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-content-muted bg-surface-secondary border border-border-subtle rounded select-none">
              Ctrl K
            </kbd>
          </button>
        </div>
      </div>

      {/* Scrimba-Style Resume & Continuation Hero Banner */}
      <ResumeHeroCard />

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
            {(error as any)?.message || 'تعذر تحميل قائمة الدورات. يرجى إعادة المحاولة.'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onQuickCheckout={handleQuickCheckout}
            />
          ))}
        </div>
      )}

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
