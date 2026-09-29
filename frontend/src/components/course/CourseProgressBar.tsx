'use client';

import React from 'react';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';
import { Sparkles, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseProgressBarProps {
  courseTitle: string;
  percentComplete?: number;
  bundlePriceUsd: number;
  promotionalTickets: number;
  onBuyBundle: () => void;
  className?: string;
}

export function CourseProgressBar({
  courseTitle,
  percentComplete = 0,
  bundlePriceUsd,
  promotionalTickets,
  onBuyBundle,
  className,
}: CourseProgressBarProps) {
  return (
    <aside
      aria-label="شريط التقدم والشراء السريع"
      className={cn(
        'fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3 px-4 shadow-2xl transition-all animate-in slide-in-from-bottom duration-300',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
        {/* Progress & Course Info */}
        <div className="w-full sm:w-auto flex-1 flex items-center gap-4">
          <div className="hidden md:block max-w-xs truncate">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
              {courseTitle}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              مسار مهني تدريبي معتمد
            </span>
          </div>

          <div className="flex-1 max-w-md">
            <ProgressBar
              value={percentComplete}
              label={percentComplete > 0 ? `${percentComplete}% مكتمل` : 'جاهز للبدء'}
              showPercentage
              size="sm"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="text-start sm:text-end">
            <div className="flex items-center gap-1.5 text-xs font-bold text-secondary dark:text-white">
              <span>${bundlePriceUsd.toFixed(2)}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[11px] font-black border border-accent/25">
                <Ticket className="w-3 h-3 text-accent" />
                <span>{promotionalTickets} تذكرة</span>
              </span>
            </div>
            <span className="text-[11px] text-success font-semibold hidden sm:inline">
              وفر 17% مع الحقيبة الكاملة
            </span>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={onBuyBundle}
            leftIcon={<Sparkles className="w-4 h-4 text-accent" />}
            className="w-full sm:w-auto"
          >
            <span>شراء الحقيبة كاملة</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
