'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  ArrowRight,
  Play,
  Lock,
  CheckCircle,
  Ticket,
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatusIndicator } from '@/components/ui/status-indicator';

export interface SidebarPartItem {
  id: string;
  part_number: number;
  title: string;
  duration_minutes: number;
  isUnlocked: boolean;
  isCompleted?: boolean;
}

interface LessonSidebarProps {
  courseTitle: string;
  courseSlug: string;
  parts: SidebarPartItem[];
  activePartNumber: number;
  bundlePriceCents: number;
  bundlePromotionalTickets: number;
  onBuyBundle: () => void;
}

export function LessonSidebar({
  courseTitle,
  courseSlug,
  parts,
  activePartNumber,
  bundlePriceCents,
  bundlePromotionalTickets,
  onBuyBundle,
}: LessonSidebarProps) {
  const locale = useLocale();
  const t = useTranslations('catalog');
  const isRtl = locale === 'ar';

  const completedCount = parts.filter((p) => p.isCompleted).length;
  const percentComplete = Math.round((completedCount / (parts.length || 1)) * 100);

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-5">
      {/* Back to course link */}
      <div>
        <Link
          href={`/courses/${courseSlug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
          <span>{locale === 'ar' ? 'العودة لصفحة الدورة' : 'Back to course page'}</span>
        </Link>
      </div>

      {/* Course Overview Card & Progress Track */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="text-primary flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-black text-secondary dark:text-white truncate">
              {courseTitle}
            </h3>
            <span className="text-[11px] text-slate-400">
              6 {locale === 'ar' ? 'أجزاء مهنية' : 'Parts'}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>{locale === 'ar' ? 'التقدم الإجمالي' : 'Overall Progress'}</span>
            <span>{percentComplete}%</span>
          </div>
          <ProgressBar value={percentComplete} size="sm" />
        </div>
      </div>

      {/* Curriculum Parts Tree */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-xs font-extrabold text-secondary dark:text-white">
            {locale === 'ar' ? 'فهرس الأجزاء' : 'Curriculum Parts'}
          </span>
          <span className="text-[11px] font-bold text-slate-400">
            {parts.length} {locale === 'ar' ? 'أجزاء' : 'parts'}
          </span>
        </div>

        <div className="p-2 space-y-1 max-h-[460px] overflow-y-auto">
          {parts.map((part) => {
            const isActive = part.part_number === activePartNumber;

            let status: 'now-playing' | 'completed' | 'in-progress' | 'locked' = 'locked';
            if (isActive) {
              status = 'now-playing';
            } else if (part.isCompleted) {
              status = 'completed';
            } else if (part.isUnlocked) {
              status = 'in-progress';
            }

            return (
              <Link
                key={part.id}
                href={`/lessons/${courseSlug}?part=${part.part_number}`}
                className={`flex items-center justify-between p-3 rounded-xl transition-all text-start group ${
                  isActive
                    ? 'bg-primary-light/80 dark:bg-primary/10 border border-primary/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <StatusIndicator status={status} showIconOnly />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-black ${
                          isActive ? 'text-primary' : 'text-slate-400'
                        }`}
                      >
                        {part.part_number}.0
                      </span>
                      <h4
                        className={`text-xs font-bold truncate ${
                          isActive
                            ? 'text-primary dark:text-primary-light'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {part.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-medium">
                      <span>{part.duration_minutes} {locale === 'ar' ? 'د' : 'm'}</span>
                      {isActive && (
                        <span className="text-primary font-bold">
                          • {locale === 'ar' ? 'الآن' : 'Playing'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!part.isUnlocked && !isActive && (
                  <span className="text-slate-400 shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bundle Upsell Card in Sidebar */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-secondary to-secondary-surface text-white shadow-md border border-secondary-surface space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-primary-light uppercase tracking-wide">
            {locale === 'ar' ? 'باقة الدورة كاملة' : 'Full Course Bundle'}
          </span>
          <span className="text-accent text-[10px] font-black flex items-center gap-1">
            <Ticket className="w-3 h-3" />
            <span>{bundlePromotionalTickets} {locale === 'ar' ? 'تذاكر' : 'tickets'}</span>
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-white">
              ${(bundlePriceCents / 100).toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-300">
              {t('bundleIqdLabel')}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1 leading-snug">
            {locale === 'ar'
              ? 'افتح جميع أجزاء الدورة واحصل على 15 تذكرة سحب مجانية'
              : 'Unlock all course parts and receive 15 free promotional raffle tickets'}
          </p>
        </div>

        <button
          type="button"
          onClick={onBuyBundle}
          className="w-full py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black shadow-md shadow-primary/30 transition-all flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>{locale === 'ar' ? 'شراء الباقة بـ 10$' : 'Get Bundle for $10'}</span>
        </button>
      </div>
    </aside>
  );
}
