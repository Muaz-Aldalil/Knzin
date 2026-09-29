'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useActiveDraws, useConcludedDraws } from '@/hooks/useDraws';
import { DrawCard } from './DrawCard';
import { ConcludedDrawsList } from './ConcludedDrawsList';
import { Clock, Trophy, Sparkles, AlertCircle } from 'lucide-react';

export function DrawsArena() {
  const t = useTranslations('draws');
  const [activeTab, setActiveTab] = useState<'active' | 'concluded'>('active');

  // Deep-link section target resolution (Protocol Sections 6, 16 & 17)
  useEffect(() => {
    const syncTabWithHash = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      if (hash === '#hall-of-fame' || hash === '#concluded') {
        setActiveTab('concluded');
        requestAnimationFrame(() => {
          const el = document.getElementById('hall-of-fame');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        });
      } else if (hash === '#active' || hash === '#draws-arena') {
        setActiveTab('active');
        requestAnimationFrame(() => {
          const el = document.getElementById('draws-arena');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
    };

    syncTabWithHash();
    window.addEventListener('hashchange', syncTabWithHash);
    return () => window.removeEventListener('hashchange', syncTabWithHash);
  }, []);

  const {
    draws: activeDraws,
    serverTimeUtc,
    isLoading: isLoadingActive,
    isError: isErrorActive,
  } = useActiveDraws();

  const {
    draws: concludedDraws,
    isLoading: isLoadingConcluded,
  } = useConcludedDraws();

  return (
    <div id="draws-arena" className="w-full space-y-8 py-6 scroll-mt-20">
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t('arenaTitle')}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
          {t('arenaTitle')}
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t('arenaSubtitle')}
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 rounded-2xl bg-muted/60 border border-border/80 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{t('tabActive')}</span>
            {activeDraws.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-bold">
                {activeDraws.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('concluded')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'concluded'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>{t('tabConcluded')}</span>
            {concludedDraws.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                {concludedDraws.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'active' ? (
          <div>
            {isLoadingActive ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-96 rounded-2xl bg-muted/30 border border-border animate-pulse"
                  />
                ))}
              </div>
            ) : activeDraws.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-muted/20 border border-border">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">{t('emptyActive')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeDraws.map((draw) => (
                  <DrawCard key={draw.id} draw={draw} serverTimeUtc={serverTimeUtc} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div id="hall-of-fame" className="scroll-mt-24">
            {isLoadingConcluded ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-80 rounded-2xl bg-muted/30 border border-border animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <ConcludedDrawsList draws={concludedDraws} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
