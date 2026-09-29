'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Play, Sparkles, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const lessonSlug = `${data.course_slug}-part-${data.part_number}`;
  const resumeHref = `/lessons/${lessonSlug}?t=${data.watch_seconds}`;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <Card className="relative overflow-hidden border border-primary/30 bg-gradient-to-r from-surface via-surface to-primary/5 p-5 sm:p-6 shadow-md shadow-primary/5 dark:border-primary/20 dark:from-surface dark:via-surface dark:to-primary/10">
        <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Thumbnail & Details */}
          <div className="flex flex-col sm:flex-row items-center gap-5 w-full md:w-auto">
            {/* Video Cover Thumbnail */}
            <div className="relative w-full sm:w-44 h-28 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-border-subtle group">
              {data.cover_image_url ? (
                <Image
                  src={data.cover_image_url}
                  alt={courseTitle}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105 opacity-90"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                  <Play className="w-8 h-8 text-primary" />
                </div>
              )}
              <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform duration-200 group-hover:scale-110">
                  <Play className="w-5 h-5 fill-current ms-0.5" />
                </span>
              </div>
              <div className="absolute bottom-2 end-2 bg-slate-950/80 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-mono text-white font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-accent" />
                {formatTime(data.watch_seconds)}
              </div>
            </div>

            {/* Titles & Status */}
            <div className="flex flex-col gap-1.5 text-center sm:text-start rtl:sm:text-right">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Badge variant="accent" size="sm" className="font-black gap-1 text-[11px]">
                  <Sparkles className="w-3 h-3 text-slate-950" />
                  {isRtl ? 'تابِع من حيث توقفت' : 'Jump Back In'}
                </Badge>
                <span className="text-xs text-content-muted font-bold">
                  {isRtl ? `الجزء ${data.part_number}` : `Part ${data.part_number}`}
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-black text-content-primary line-clamp-1">
                {partTitle}
              </h4>
              <p className="text-xs sm:text-sm text-content-secondary line-clamp-1 font-medium">
                {courseTitle}
              </p>

              {/* Progress Bar & Percentage */}
              <div className="mt-2 w-full max-w-xs flex items-center gap-3">
                <Progress value={data.percent_complete} className="h-2 flex-1" />
                <span className="text-xs font-mono font-black text-primary shrink-0">
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
              size="lg"
              className="w-full sm:w-auto shadow-md shadow-primary/20 gap-2 font-black"
              rightIcon={isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            >
              {isRtl ? 'متابعة الدرس الآن' : 'Continue Lesson'}
            </ButtonLink>
          </div>
        </div>
      </Card>
    </div>
  );
}
