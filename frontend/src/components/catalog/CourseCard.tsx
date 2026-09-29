'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Ticket, BookOpen, Sparkles, ArrowLeft, ArrowRight, Layers } from 'lucide-react';
import { CheckoutItemData } from '@/components/checkout/CheckoutBottomSheet';

export interface CourseData {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  cover_image_url: string;
  bundle_price_cents: number;
  bundle_promotional_tickets: number;
  display_price_label: string;
  parts_count: number;
}

interface CourseCardProps {
  course: CourseData;
  onQuickCheckout?: (item: CheckoutItemData) => void;
}

export default function CourseCard({ course, onQuickCheckout }: CourseCardProps) {
  const locale = useLocale();
  const t = useTranslations('catalog');
  const tCommon = useTranslations('common');

  const title = locale === 'ar' ? course.title_ar : course.title_en;
  const description = locale === 'ar' ? course.description_ar : course.description_en;

  const handleBundleClick = (e: React.MouseEvent) => {
    if (onQuickCheckout) {
      e.preventDefault();
      onQuickCheckout({
        courseId: course.id,
        courseTitle: title,
        itemType: 'bundle',
        priceCents: course.bundle_price_cents,
        promotionalTickets: course.bundle_promotional_tickets,
        displayPriceLabel: course.display_price_label,
      });
    }
  };

  return (
    <div className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
      {/* Visual Accent Top Bar */}
      <div className="h-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Badge Row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/50 dark:border-blue-800/40">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>{course.parts_count || 6} أجزاء تطبيقية</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black border border-amber-500/25">
              <Ticket className="w-3.5 h-3.5 text-amber-500" />
              <span>{course.bundle_promotional_tickets} {tCommon('ticket')}</span>
            </span>
          </div>

          {/* Title */}
          <h2 className="text-lg font-extrabold text-[#0B1E3A] dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <Link href={`/courses/${course.slug}`}>{title}</Link>
          </h2>

          {/* Description */}
          <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Pricing & Actions Section */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          {/* Price Tag Row */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">
                {t('bundleOffer')}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-[#0B1E3A] dark:text-white">
                  ${(course.bundle_price_cents / 100).toFixed(2)}
                </span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  ({course.display_price_label})
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              وفر 2$ + 15 تذكرة
            </div>
          </div>

          {/* Dual Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href={`/courses/${course.slug}`}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>الأجزاء (2$)</span>
            </Link>

            <button
              onClick={handleBundleClick}
              className="w-full py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>{t('buyBundle')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
