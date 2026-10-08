'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';

interface FooterPartMeta {
  part_number: number;
  title: string;
  duration_minutes: number;
}

interface LessonFooterNavProps {
  courseSlug: string;
  previousPart?: FooterPartMeta | null;
  nextPart?: FooterPartMeta | null;
}

export function LessonFooterNav({
  courseSlug,
  previousPart,
  nextPart,
}: LessonFooterNavProps) {
  const locale = useLocale();

  return (
    <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Previous Part */}
      {previousPart ? (
        <Link
          href={`/lessons/${courseSlug}?part=${previousPart.part_number}`}
          className="w-full sm:w-auto p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-3 text-start group"
        >
          <div className="text-slate-500 group-hover:text-primary flex items-center justify-center shrink-0 transition-colors">
            <ArrowRight className="w-5 h-5 rtl:rotate-0 ltr:rotate-180" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block">
              {locale === 'ar' ? 'الجزء السابق' : 'Previous Part'}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors truncate max-w-[200px] block">
              {previousPart.title}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{previousPart.duration_minutes} {locale === 'ar' ? 'دقيقة' : 'min'}</span>
            </span>
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}

      {/* Next Part */}
      {nextPart ? (
        <Link
          href={`/lessons/${courseSlug}?part=${nextPart.part_number}`}
          className="w-full sm:w-auto p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-between sm:justify-end gap-3 text-end group ms-auto"
        >
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block">
              {locale === 'ar' ? 'الجزء التالي' : 'Next Part'}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors truncate max-w-[200px] block">
              {nextPart.title}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 justify-end">
              <Clock className="w-3 h-3" />
              <span>{nextPart.duration_minutes} {locale === 'ar' ? 'دقيقة' : 'min'}</span>
            </span>
          </div>
          <div className="text-primary flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
            <ArrowLeft className="w-5 h-5 rtl:rotate-0 ltr:rotate-180" />
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}
    </div>
  );
}
