import React, { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { parseVideoUrl, formatTimestamp } from '@/lib/video';
import { Play, Lock, Sparkles, Ticket, ShieldCheck, RefreshCw, CheckCircle2, ArrowLeft, ArrowRight, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWatchDepth } from '@/components/analytics/use-watch-depth';
import { Link } from '@/i18n/routing';
import { useSiteWideCms } from '@/hooks/admin/useAdminCms';
import { LessonWatermarkOverlay } from './LessonWatermarkOverlay';
import { WatermarkData, PaywallPricing } from '@/hooks/useLessonPlayback';

interface LessonVideoPlayerProps {
  videoUrl: string;
  durationSeconds: number;
  partNumber: number;
  partTitle: string;
  courseTitle: string;
  courseSlug?: string;
  isUnlocked: boolean;
  startSeconds?: number;
  watermarkText?: string;
  watermarkData?: WatermarkData | null;
  pricing?: PaywallPricing | null;
  nextPart?: { part_number: number; title: string; duration_minutes: number } | null;
  onBuyPart: () => void;
  onBuyBundle: () => void;
  onVideoStart?: (startSeconds: number) => void;
}

export function LessonVideoPlayer({
  videoUrl,
  durationSeconds,
  partNumber,
  partTitle,
  courseTitle,
  courseSlug,
  isUnlocked,
  startSeconds = 0,
  watermarkText = 'KNZIN-LEARNER',
  watermarkData,
    pricing,
    nextPart,
    onBuyPart,
    onBuyBundle,
    onVideoStart,
  }: LessonVideoPlayerProps) {
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const isAr = locale === 'ar';
    const { data: cmsData } = useSiteWideCms();
    const lessonCms = cmsData?.sections?.lesson_player;
    const [isPlaying, setIsPlaying] = useState(startSeconds > 0 && isUnlocked);
    const [dismissCompletionCard, setDismissCompletionCard] = useState(false);
    const parsedVideo = parseVideoUrl(videoUrl, startSeconds);

    // Watch depth tracking & MySQL database persistence
    const { depth, isCompleted } = useWatchDepth({
      durationSeconds,
      isPlaying: isPlaying && isUnlocked,
      startSeconds,
      courseSlug,
      partNumber,
    });

    const handleStartPlay = () => {
      setIsPlaying(true);
      onVideoStart?.(startSeconds);
    };

    // Autoplay if startSeconds was provided
    useEffect(() => {
      if (startSeconds > 0 && isUnlocked) {
        setIsPlaying(true);
      }
    }, [startSeconds, isUnlocked]);

    // Locked State
    if (!isUnlocked) {
      const paywallHeadline =
        (isAr ? lessonCms?.paywall_headline_ar : lessonCms?.paywall_headline_en) ||
        (locale === 'ar'
          ? `هذا الجزء التدريبي (#${partNumber}) محمي`
          : `This Training Part (#${partNumber}) is Protected`);

      const paywallSubheadline =
        (isAr ? lessonCms?.paywall_subheadline_ar : lessonCms?.paywall_subheadline_en) ||
        (locale === 'ar'
          ? `احصل على المحتوى الكامل، الفيديو بدقة عالية، والملفات المرفقة بـ ${((pricing?.part_price_cents ?? 200) / 100).toFixed(2)}$ فقط بدون أي اشتراكات دورية.`
          : `Get full access, high-definition video, and downloadable resources for only $${((pricing?.part_price_cents ?? 200) / 100).toFixed(2)} with lifetime access.`);

      const unlockButtonLabel =
        (isAr ? lessonCms?.paywall_cta_label_ar : lessonCms?.paywall_cta_label_en) ||
        (locale === 'ar'
          ? `فتح هذا الجزء (${((pricing?.part_price_cents ?? 200) / 100).toFixed(2)}$)`
          : `Unlock This Part ($${((pricing?.part_price_cents ?? 200) / 100).toFixed(2)})`);

      return (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col items-center justify-center p-6 text-center">
          {/* Subtle background ambient graphic */}
          <div className="absolute inset-0 bg-gradient-to-tr from-secondary/80 via-slate-950/90 to-primary/20 pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 max-w-md space-y-4">
            <div className="text-amber-500 flex items-center justify-center mx-auto">
              <Lock className="w-12 h-12" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-accent text-xs font-black">
                <Ticket className="w-3.5 h-3.5" />
                <span>{pricing?.part_promotional_tickets ?? 1} {locale === 'ar' ? 'تذكرة سحب ترويجية مجانية' : 'Promotional Ticket'}</span>
              </span>

              <h3 className="text-lg sm:text-xl font-black text-white">
                {paywallHeadline}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {paywallSubheadline}
              </p>
            </div>

            {/* Action CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onBuyPart}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{unlockButtonLabel}</span>
              </button>

              <button
                type="button"
                onClick={onBuyBundle}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>
                  {locale === 'ar'
                    ? `الباقة كاملة ${((pricing?.bundle_price_cents ?? 1000) / 100).toFixed(2)}$ (${pricing?.bundle_promotional_tickets ?? 15} تذكرة)`
                    : `Full Bundle $${((pricing?.bundle_price_cents ?? 1000) / 100).toFixed(2)} (${pricing?.bundle_promotional_tickets ?? 15} Tickets)`}
                </span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              {locale === 'ar'
                ? 'مشمول بدرع الحماية القانوني وضمان الوصول الفوري'
                : 'Backed by the Canonical Legal Shield & Instant Access'}
            </p>
          </div>
        </div>
      );
    }

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl group">
      {/* Drifting HTML5 Canvas Anti-Piracy Watermark */}
      <LessonWatermarkOverlay watermark={watermarkData ?? null} />

      {/* Static Fallback Watermark */}
      {!watermarkData && (
        <div className="absolute top-4 start-4 z-20 pointer-events-none opacity-30 select-none text-[10px] font-mono text-white/70 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
          {watermarkText} • {new Date().toISOString().slice(0, 10)}
        </div>
      )}

      {isPlaying ? (
        parsedVideo.provider !== 'direct' && parsedVideo.embedUrl ? (
          <iframe
            src={parsedVideo.embedUrl}
            title={partTitle}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video
            src={videoUrl}
            controls
            autoPlay
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-contain bg-black"
          />
        )
      ) : (
        /* Poster Frame Pre-render */
        <div className="relative w-full h-full bg-slate-900 flex items-center justify-center cursor-pointer select-none" onClick={handleStartPlay}>
          {/* Subtle gradient backdrop simulating real video poster */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-900/80 to-slate-950 flex flex-col justify-end p-6" />

          {/* Centered Play Button */}
          <button
            type="button"
            aria-label="Play video"
            className="relative z-10 w-20 h-20 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center shadow-2xl shadow-primary/50 transition-all transform group-hover:scale-110 active:scale-95"
          >
            <Play className="w-9 h-9 fill-current ms-0.5" />
          </button>

          {/* Bottom Video Meta Bar */}
          <div className="absolute bottom-4 inset-x-4 z-10 flex items-center justify-between text-xs text-white">
            <span className="font-bold drop-shadow-md truncate max-w-[70%]">
              {partTitle}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-black/80 font-mono text-xs border border-white/10">
              {formatTimestamp(durationSeconds)}
            </span>
          </div>

          {startSeconds > 0 && (
            <div className="absolute top-4 end-4 z-10 px-3 py-1 rounded-full bg-accent text-secondary text-xs font-black shadow-lg">
              {locale === 'ar' ? `البدء من ${formatTimestamp(startSeconds)}` : `Starts at ${formatTimestamp(startSeconds)}`}
            </div>
          )}
        </div>
      )}

      {/* Scrimba-style Celebratory "Up Next" Overlay */}
      {(isCompleted || depth >= 95) && !dismissCompletionCard && (
        <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in-0 duration-300">
          <div className="text-success mb-3 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <Badge variant="accent" size="sm" className="mb-2 font-black">
            {isRtl ? 'اكتمل هذا الجزء بنجاح!' : 'Part Completed!'}
          </Badge>

          <h3 className="text-lg sm:text-xl font-black text-white max-w-md">
            {partTitle}
          </h3>

          {nextPart ? (
            <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 max-w-sm w-full">
              <span className="text-xs text-slate-400 block mb-1">
                {isRtl ? 'الدرس التالي مباشرة:' : 'Next Up:'}
              </span>
              <p className="text-sm font-bold text-white line-clamp-1">
                {nextPart.title}
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Link
                  href={`/lessons/${courseSlug || ''}-part-${nextPart.part_number}`}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-primary/30"
                >
                  <span>{isRtl ? 'الانتقال للدرس التالي' : 'Continue to Next Lesson'}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </Link>
                <button
                  type="button"
                  onClick={() => setDismissCompletionCard(true)}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                  title={isRtl ? 'إعادة المشاهدة' : 'Replay'}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <h4 className="text-base font-bold text-accent">
                {(isAr ? lessonCms?.completion_banner_title_ar : lessonCms?.completion_banner_title_en) ||
                  (isRtl ? 'تهانينا! لقد أنهيت جميع أجزاء هذه الدورة المهنية بنجاح.' : 'Congratulations! You have completed all parts of this course.')}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                {(isAr ? lessonCms?.completion_banner_desc_ar : lessonCms?.completion_banner_desc_en) ||
                  (isRtl ? 'تم توثيق تقدمك وإصدار تذاكر السحب المؤهلة في محفظتك.' : 'Your progress has been certified and tickets recorded in your ledger.')}
              </p>
              <button
                type="button"
                onClick={() => setDismissCompletionCard(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
