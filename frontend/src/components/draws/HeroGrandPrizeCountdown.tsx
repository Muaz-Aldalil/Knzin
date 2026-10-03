'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useGrandPrizeDraw } from '@/hooks/useDraws';
import { CountdownClock } from './CountdownClock';
import { PulsatingLockBadge } from './PulsatingLockBadge';
import { SeedCommitmentBadge } from './SeedCommitmentBadge';
import { Sparkles, ArrowRight, ShieldCheck, Gift } from 'lucide-react';

export function HeroGrandPrizeCountdown() {
  const t = useTranslations('draws');
  const { grandDraw, serverTimeUtc, isLoading } = useGrandPrizeDraw();
  const [isLocallyLocked, setIsLocallyLocked] = useState(false);

  if (isLoading || !grandDraw) {
    return null;
  }

  const isLocked = isLocallyLocked || grandDraw.status === 'locked';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-background p-6 md:p-8 shadow-lg my-8">
      {/* Decorative Background Glow */}
      <div className="pointer-events-none absolute -top-24 -end-24 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -start-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Copy, Valuation & Call to Action */}
        <div className="lg:col-span-7 space-y-5 text-start">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-amber-950 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 fill-current" />
              {t('heroMarqueeBadge')}
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              {grandDraw.badge_label}
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              {grandDraw.prize.title}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
              {t('heroMarqueeSubtitle')}
            </p>
          </div>

          {/* Price valuation pill */}
          <div className="inline-flex items-baseline gap-2 px-4 py-2 rounded-2xl bg-surface border border-border shadow-xs">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              {t('approxIqd')}:
            </span>
            <span className="text-xl sm:text-2xl font-black text-foreground">
              ${grandDraw.prize.valuation_usd.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              ({grandDraw.prize.display_iqd_label})
            </span>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/#catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:bg-primary/90 hover:scale-[1.02] transition-all duration-200"
            >
              <Gift className="h-4 w-4" />
              <span>{t('browseCoursesToEnter')}</span>
            </Link>

            <Link
              href="/raffle"
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-muted/60 text-foreground text-sm font-semibold hover:bg-muted transition-colors border border-border"
            >
              <span>{t('tabActive')}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>

        {/* Right Column: Live Countdown Box & Grand Prize Image */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4">
          <div className="relative aspect-16/10 w-full max-w-md rounded-2xl overflow-hidden border border-border shadow-md">
            <Image
              src={grandDraw.prize.image_url}
              alt={grandDraw.prize.title}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 inset-x-3 text-white text-xs font-medium text-center">
              {grandDraw.prize.title}
            </div>
          </div>

          {/* Live Synchronized Countdown Widget */}
          <div className="w-full max-w-md p-4 rounded-2xl bg-surface/90 backdrop-blur-md border border-border shadow-xs text-center">
            {isLocked ? (
              <PulsatingLockBadge
                executionType={grandDraw.execution_type}
                broadcastUrl={grandDraw.broadcast_url}
              />
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  ⏳ {t('lockedStatus').split('•')[0]}
                </span>
                <CountdownClock
                  targetDate={grandDraw.ends_at}
                  serverTimeUtc={serverTimeUtc}
                  onExpire={() => setIsLocallyLocked(true)}
                  size="lg"
                  showDays={true}
                />
              </div>
            )}

            {grandDraw.seed_commitment_hash && (
              <div className="pt-3 border-t border-border/40 mt-3">
                <SeedCommitmentBadge
                  commitmentHash={grandDraw.seed_commitment_hash}
                  revealedSeed={grandDraw.revealed_server_seed}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
