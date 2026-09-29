'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { DrawItem } from '@/types/draws';
import { CountdownClock } from './CountdownClock';
import { PulsatingLockBadge } from './PulsatingLockBadge';
import { DrawTermsAccordion } from './DrawTermsAccordion';
import { ShieldCheck, Sparkles, BookOpen, Gift } from 'lucide-react';

interface DrawCardProps {
  draw: DrawItem;
  serverTimeUtc?: string;
  className?: string;
}

export function DrawCard({ draw, serverTimeUtc, className = '' }: DrawCardProps) {
  const t = useTranslations('draws');
  const [isLocallyLocked, setIsLocallyLocked] = useState(draw.status === 'locked');

  const isLocked = isLocallyLocked || draw.status === 'locked';

  // Tier color styling
  const tierColorBadge =
    draw.tier === 'monthly'
      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      : draw.tier === 'daily'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : 'bg-primary/10 text-primary border-primary/20';

  const tierName =
    draw.tier === 'monthly'
      ? t('tierMonthly')
      : draw.tier === 'daily'
      ? t('tierDaily')
      : t('tierHourly');

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl bg-card border border-border shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden ${
        draw.tier === 'monthly' ? 'ring-1 ring-amber-500/30' : ''
      } ${className}`}
    >
      <div>
        {/* Prize Image Container */}
        <div className="relative aspect-16/10 w-full overflow-hidden bg-muted/30">
          <Image
            src={draw.prize.image_url}
            alt={draw.prize.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-black/30" />

          {/* Tier Badge & High-Trust Label */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-xs ${tierColorBadge}`}
            >
              <Sparkles className="h-3 w-3" />
              {tierName}
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/60 text-white backdrop-blur-md">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              {draw.badge_label}
            </span>
          </div>

          {/* Valuation Floating Banner */}
          <div className="absolute bottom-3 inset-x-3 flex items-end justify-between">
            <div className="bg-background/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border/80 shadow-xs">
              <p className="text-[10px] text-muted-foreground uppercase font-medium">
                {t('approxIqd')}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-lg text-foreground">
                  ${draw.prize.valuation_usd.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-primary">
                  ({draw.prize.display_iqd_label})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 text-start">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {draw.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {draw.prize.description || draw.prize.title}
            </p>
          </div>

          {/* Countdown or Locked State */}
          <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
            {isLocked ? (
              <PulsatingLockBadge
                executionType={draw.execution_type}
                broadcastUrl={draw.broadcast_url}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('tabActive')}
                </p>
                <CountdownClock
                  targetDate={draw.ends_at}
                  serverTimeUtc={serverTimeUtc}
                  onExpire={() => setIsLocallyLocked(true)}
                  size={draw.tier === 'monthly' ? 'lg' : 'md'}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer & Action CTAs */}
      <div className="p-4 sm:p-5 pt-0 space-y-3">
        {/* Course Entry CTA */}
        <Link
          href="#catalog"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90 hover:shadow-md transition-all duration-200"
        >
          <Gift className="h-4 w-4" />
          <span>{t('browseCoursesToEnter')}</span>
        </Link>

        {/* Terms Accordion */}
        <DrawTermsAccordion tier={draw.tier} />
      </div>
    </div>
  );
}
