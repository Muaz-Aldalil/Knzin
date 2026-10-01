'use client';

import React from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Play, Clock, Sparkles } from 'lucide-react';
import { ActiveLearningItem } from '@/hooks/useLearnerDashboard';

interface JumpBackInHeroProps {
  item: ActiveLearningItem;
}

export function JumpBackInHero({ item }: JumpBackInHeroProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const courseTitle = isRtl ? item.course_title_ar : item.course_title_en;
  const partTitle = isRtl ? item.part_title_ar : item.part_title_en;

  const formatWatchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative rounded-3xl overflow-hidden bg-surface border border-border-subtle shadow-md">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
        {/* Visual Cover Banner */}
        <div className="lg:col-span-5 relative aspect-video lg:aspect-auto lg:h-full min-h-[220px] bg-slate-900 overflow-hidden">
          {item.cover_image_url && (
            <Image
              src={item.cover_image_url}
              alt={courseTitle}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-e from-black/80 via-black/40 to-transparent" />

          <div className="absolute inset-0 flex items-center justify-center">
            <Link
              href={`/courses/${item.course_slug}?part=${item.part_number}&t=${item.watch_seconds}`}
              className="w-16 h-16 rounded-full bg-primary/90 text-white flex items-center justify-center hover:scale-110 hover:bg-primary transition-all shadow-lg backdrop-blur-xs group"
              aria-label={isRtl ? 'استئناف المشاهدة' : 'Resume Playback'}
            >
              <Play className="w-7 h-7 fill-current ms-1" />
            </Link>
          </div>
        </div>

        {/* Content & Details */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3.5 h-3.5" />
                {isRtl ? 'تابع من حيث توقفت' : 'Jump Back In'}
              </span>
              <span className="text-xs text-content-muted">
                {isRtl ? `الجزء ${item.part_number}` : `Part ${item.part_number}`}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-content-primary tracking-tight">
              {partTitle}
            </h2>
            <p className="mt-1 text-sm text-content-secondary line-clamp-1 font-medium">
              {courseTitle}
            </p>
          </div>

          {/* Progress Depth & Action */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="flex items-center gap-1.5 text-content-muted">
                  <Clock className="w-3.5 h-3.5" />
                  {isRtl
                    ? `تمت مشاهدة ${formatWatchTime(item.watch_seconds)}`
                    : `Watched ${formatWatchTime(item.watch_seconds)}`}
                </span>
                <span className="font-bold text-content-primary">
                  {item.percent_complete}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface-secondary overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${item.percent_complete}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/courses/${item.course_slug}?part=${item.part_number}&t=${item.watch_seconds}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-all shadow-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isRtl ? 'استئناف المشاهدة' : 'Resume Playback'}</span>
              </Link>

              <Link
                href={`/courses/${item.course_slug}`}
                className="inline-flex items-center px-4 py-3 rounded-xl bg-surface-secondary hover:bg-surface-elevated text-content-secondary text-sm font-semibold transition-colors border border-border-subtle"
              >
                {isRtl ? 'فهرس الدورة' : 'Course Syllabus'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
