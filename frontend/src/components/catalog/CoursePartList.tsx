'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { PlayCircle, FileText, Clock, Ticket, Sparkles, CheckCircle } from 'lucide-react';
import { CheckoutItemData } from '@/components/checkout/CheckoutBottomSheet';

export interface CoursePartData {
  id: string;
  part_number: number;
  title_ar: string;
  title_en: string;
  syllabus_ar: string;
  syllabus_en: string;
  part_price_cents: number;
  part_promotional_tickets: number;
  display_price_label: string;
  resource_types: string[];
  duration_minutes: number;
}

interface CoursePartListProps {
  courseId: string;
  courseTitle: string;
  parts: CoursePartData[];
  onSelectPart: (item: CheckoutItemData) => void;
}

export default function CoursePartList({
  courseId,
  courseTitle,
  parts,
  onSelectPart,
}: CoursePartListProps) {
  const locale = useLocale();
  const t = useTranslations('catalog');
  const tCommon = useTranslations('common');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-[#0B1E3A] dark:text-white flex items-center gap-2">
          <span>{t('partsTitle')}</span>
        </h3>
        <span className="text-xs text-slate-500 font-semibold">
          6 أجزاء مستقلة • 2$ لكل جزء
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {parts.map((part) => {
          const partTitle = locale === 'ar' ? part.title_ar : part.title_en;
          const syllabus = locale === 'ar' ? part.syllabus_ar : part.syllabus_en;

          return (
            <div
              key={part.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 transition-all duration-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-black">
                    {t('partNumber', { number: part.part_number })}
                  </span>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{t('duration', { minutes: part.duration_minutes })}</span>
                    </span>

                    <span>•</span>

                    <span className="flex items-center gap-1">
                      <PlayCircle className="w-3.5 h-3.5 text-blue-500" />
                      <span>فيديو + PDF</span>
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {partTitle}
                </h4>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                  {syllabus}
                </p>
              </div>

              {/* Price & Action Section */}
              <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                <div className="text-right">
                  <div className="flex items-baseline gap-1.5 justify-end">
                    <span className="text-base font-extrabold text-[#0B1E3A] dark:text-white">
                      ${(part.part_price_cents / 100).toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({part.display_price_label})
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    <Ticket className="w-3 h-3 text-amber-500" />
                    <span>{part.part_promotional_tickets} {tCommon('ticket')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onSelectPart({
                      courseId,
                      courseTitle,
                      itemType: 'part',
                      partId: part.id,
                      partNumber: part.part_number,
                      partTitle,
                      priceCents: part.part_price_cents,
                      promotionalTickets: part.part_promotional_tickets,
                      displayPriceLabel: part.display_price_label,
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#1877F2] text-white text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                >
                  {t('buyPart')} (2$)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
