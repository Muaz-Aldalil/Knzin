'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import CourseCard from '@/components/catalog/CourseCard';
import CheckoutBottomSheet, { CheckoutItemData } from '@/components/checkout/CheckoutBottomSheet';
import { ResumeHeroCard } from '@/components/course/ResumeHeroCard';
import { useCatalog } from '@/hooks/useCatalog';
import { Loader2, AlertCircle, Sparkles, Trophy, ShieldCheck, Zap, Search } from 'lucide-react';

export default function CatalogPage() {
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
  } = useCatalog();

  const handleQuickCheckout = (item: CheckoutItemData) => {
    setCheckoutItem(item);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <div className="relative text-center max-w-4xl mx-auto pt-4 sm:pt-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-light/60 dark:bg-primary/10 text-primary text-xs font-bold border border-primary/20">
          <Zap className="w-3.5 h-3.5 text-primary fill-primary" />
          <span>التعليم المهني المصغر الأول في العراق مع هدايا ترويجية قانونية</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-secondary dark:text-white tracking-tight leading-tight">
          {t('heading')}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t('subheading')}
        </p>

        {/* Supabase-style In-Place Quick Search Trigger */}
        <div className="pt-2 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('knzin:open-search'))}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-surface-primary hover:bg-surface-elevated border border-border-subtle hover:border-primary/50 text-content-muted hover:text-content-primary shadow-sm hover:shadow-md transition-all group cursor-pointer text-start"
          >
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-medium">
                ابحث في المهارات، الأدوات، أو اللحظات التدريبية...
              </span>
            </div>
            <kbd className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-bold text-content-muted bg-surface-secondary border border-border-subtle rounded-lg shadow-xs select-none group-hover:border-primary/40 group-hover:text-primary transition-colors">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Value Proposition Highlights */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 dark:text-slate-400 font-semibold">
          <span className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-accent" />
            <span>تذاكر سحب مجانية مرفقة مع كل عملية شراء</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>تسعير دينار عراقي ثابت (سعر صرف 1,310)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>شراء أجزاء منفصلة بـ 2$ أو الحقيبة بـ 10$</span>
          </span>
        </div>
      </div>

      {/* Scrimba-Style Resume & Continuation Hero Banner */}
      <ResumeHeroCard />

      {/* State 1: Loading (muaz-skill mandatory state) */}
      {isLoading && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-semibold">{tCommon('loading')}</p>
        </div>
      )}

      {/* State 2: Error (muaz-skill mandatory state) */}
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

      {/* State 3: Empty State (muaz-skill mandatory state) */}
      {!isLoading && !isError && (!courses || courses.length === 0) && (
        <div className="text-center py-16 text-slate-500">
          <p className="text-sm font-semibold">{tCommon('emptyState')}</p>
        </div>
      )}

      {/* State 4: Courses Grid */}
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

      {/* Checkout Bottom Sheet (Integrated across catalog) */}
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
