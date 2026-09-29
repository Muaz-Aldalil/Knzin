'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Play, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ButtonLink } from '@/components/ui/button';
import { fetchActiveLearning, ActiveLearningData } from '@/lib/progress';

export function ResumeHeroCard() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [data, setData] = useState<ActiveLearningData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    fetchActiveLearning().then((res) => {
      if (mounted) {
        setData(res);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading || !data) {
    return null;
  }

  const courseTitle = isRtl ? data.course_title_ar : data.course_title_en;
  const partTitle = isRtl ? data.part_title_ar : data.part_title_en;
  const resumeHref = `/lessons/${data.course_slug}?part=${data.part_number}&t=${data.watch_seconds}`;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <Card className="border border-border-subtle bg-surface-primary p-4 sm:p-5 rounded-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          {/* Left: Thumbnail & Details */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Video Cover Thumbnail */}
            <div className="relative w-full sm:w-40 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-900 border border-border-subtle group">
              {data.cover_image_url ? (
                <Image
                  src={data.cover_image_url}
                  alt={courseTitle}
                  fill
                  unoptimized
                  className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                  <Play className="w-6 h-6 text-primary" />
                </div>
              )}
              <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-white">
                  <Play className="w-4 h-4 fill-current ms-0.5" />
                </span>
              </div>
              <div className="absolute bottom-1.5 end-1.5 bg-slate-950/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white font-medium flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-accent" />
                {formatTime(data.watch_seconds)}
              </div>
            </div>

            {/* Titles & Status */}
            <div className="flex flex-col gap-1 text-center sm:text-start rtl:sm:text-right">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-semibold text-primary">
                  {isRtl ? 'متابعة التدريب' : 'Continue Training'}
                </span>
                <span className="text-content-muted">·</span>
                <span className="text-xs text-content-muted">
                  {isRtl ? `الجزء ${data.part_number}` : `Part ${data.part_number}`}
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-content-primary line-clamp-1">
                {partTitle}
              </h4>
              <p className="text-xs text-content-secondary line-clamp-1">
                {courseTitle}
              </p>

              {/* Progress Bar & Percentage */}
              <div className="mt-1.5 w-full max-w-xs flex items-center gap-2.5">
                <Progress value={data.percent_complete} className="h-1.5 flex-1" />
                <span className="text-xs font-mono font-semibold text-content-secondary shrink-0">
                  {data.percent_complete}%
                </span>
              </div>
            </div>
          </div>

          {/* Right: Primary Action Button */}
          <div className="w-full md:w-auto shrink-0 flex items-center justify-end">
            <ButtonLink
              href={resumeHref}
              variant="primary"
              size="sm"
              className="w-full sm:w-auto font-medium gap-1.5 text-xs"
              rightIcon={isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            >
              {isRtl ? 'متابعة الدرس' : 'Continue'}
            </ButtonLink>
          </div>
        </div>
      </Card>
    </div>
  );
}
