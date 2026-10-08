'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Play, CheckCircle, Lock, Sparkles, BookOpen } from 'lucide-react';
import { EnrolledCourseItem } from '@/hooks/useLearnerDashboard';

interface EnrolledCourseCardProps {
  course: EnrolledCourseItem;
  onUpgradeClick?: (course: EnrolledCourseItem) => void;
}

export function EnrolledCourseCard({ course, onUpgradeClick }: EnrolledCourseCardProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [imageError, setImageError] = useState(false);

  const title = isRtl ? course.title_ar : course.title_en;
  const isBundle = course.entitlement_type === 'bundle';
  const hasRemainingParts = course.owned_parts_count < course.total_active_parts;

  return (
    <div className="flex flex-col rounded-2xl bg-surface border border-border-subtle hover:border-border transition-all duration-200 overflow-hidden shadow-2xs group">
      {/* Course Cover Image Banner */}
      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
        {course.cover_image_url && !imageError ? (
          <Image
            src={course.cover_image_url}
            alt={title}
            fill
            unoptimized
            onError={() => setImageError(true)}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-secondary text-content-muted">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Badges Overlay */}
        <div className="absolute top-3 inset-inline-start-3 flex flex-wrap items-center gap-2">
          {course.is_course_completed ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/90 text-white backdrop-blur-xs shadow-xs">
              <CheckCircle className="w-3.5 h-3.5" />
              {isRtl ? 'مكتملة بالكامل' : 'Course Completed'}
            </span>
          ) : isBundle ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/90 text-white backdrop-blur-xs shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              {isRtl ? 'الحقيبة الشاملة' : 'Full Bundle'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/90 text-white backdrop-blur-xs shadow-xs">
              <BookOpen className="w-3.5 h-3.5" />
              {isRtl
                ? `جزء ${course.owned_parts_count} من ${course.total_active_parts}`
                : `${course.owned_parts_count} of ${course.total_active_parts} Parts`}
            </span>
          )}
        </div>
      </div>

      {/* Course Details Body */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-content-primary line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Progress Indicators */}
          <div className="mt-4 space-y-2.5">
            {/* Owned Scope Progress */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-content-secondary font-medium">
                  {isRtl ? 'تقدم الأجزاء المملوكة' : 'Owned Modules Progress'}
                </span>
                <span className="font-bold text-content-primary">
                  {course.owned_scope_progress_percentage}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${course.owned_scope_progress_percentage}%` }}
                />
              </div>
            </div>

            {/* Curriculum Progress (Overall) */}
            <div className="flex justify-between items-center text-[11px] text-content-muted">
              <span>
                {isRtl
                  ? `${course.completed_parts_count} من ${course.total_active_parts} أجزاء منجزة`
                  : `${course.completed_parts_count} of ${course.total_active_parts} modules completed`}
              </span>
              <span>
                {isRtl
                  ? `المنهج الكلي: ${course.overall_progress_percentage}%`
                  : `Curriculum: ${course.overall_progress_percentage}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-border-subtle flex flex-col gap-2">
          <Link
            href={`/courses/${course.slug}`}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRtl ? 'متابعة التدريب' : 'Continue Learning'}</span>
          </Link>

          {!isBundle && hasRemainingParts && (
            <button
              type="button"
              onClick={() => onUpgradeClick ? onUpgradeClick(course) : null}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold transition-colors border border-amber-500/20"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isRtl ? 'ترقية للحقيبة الشاملة (+تذاكر مجانية)' : 'Upgrade to Full Bundle (+Tickets)'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
