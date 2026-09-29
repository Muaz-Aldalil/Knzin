'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Bookmark,
  ChevronRight,
  Sparkles,
  Share2,
  Check,
  CheckCircle2,
  Play,
  Award
} from 'lucide-react';

interface LessonHeaderProps {
  courseTitle: string;
  courseSlug: string;
  partNumber: number;
  partTitle: string;
  summary: string;
  durationMinutes: number;
  promotionalTickets: number;
  isUnlocked?: boolean;
}

export function LessonHeader({
  courseTitle,
  courseSlug,
  partNumber,
  partTitle,
  summary,
  durationMinutes,
  promotionalTickets,
  isUnlocked = false,
}: LessonHeaderProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap"
      >
        <Link href="/" className="hover:text-primary transition-colors">
          {locale === 'ar' ? 'الرئيسية' : 'Home'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        <Link href={`/courses/${courseSlug}`} className="hover:text-primary transition-colors truncate max-w-[200px]">
          {courseTitle}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        <span className="text-secondary dark:text-white font-bold">
          {locale === 'ar' ? `الجزء ${partNumber}` : `Part ${partNumber}`}
        </span>
      </nav>

      {/* Main Title Row & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="video">
              {locale === 'ar' ? `الجزء ${partNumber} من 6` : `Part ${partNumber} of 6`}
            </Badge>

            <Badge variant={isUnlocked ? 'success' : 'ticket'}>
              {isUnlocked
                ? (locale === 'ar' ? 'متاح للمشاهدة' : 'Unlocked')
                : (locale === 'ar' ? 'معاينة مجانية' : 'Free Preview')}
            </Badge>

            <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>{durationMinutes} {locale === 'ar' ? 'دقيقة' : 'min'}</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-secondary dark:text-white leading-tight">
            {partTitle}
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            {summary}
          </p>
        </div>

        {/* Quick Actions (Bookmark & Share) */}
        <div className="flex items-center gap-2 self-start shrink-0">
          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            aria-label="Bookmark lesson"
            className={`p-2.5 rounded-xl border transition-all ${
              isBookmarked
                ? 'bg-accent/15 border-accent text-accent'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary hover:border-primary/40 bg-white dark:bg-slate-900'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-accent' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label="Share lesson link"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary hover:border-primary/40 bg-white dark:bg-slate-900 transition-all flex items-center gap-1"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
