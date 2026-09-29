'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { DrawExecutionType } from '@/types/draws';
import { Radio, ShieldCheck, ExternalLink, Loader2 } from 'lucide-react';

interface PulsatingLockBadgeProps {
  executionType: DrawExecutionType;
  broadcastUrl?: string | null;
  className?: string;
}

export function PulsatingLockBadge({
  executionType,
  broadcastUrl,
  className = '',
}: PulsatingLockBadgeProps) {
  const t = useTranslations('draws');

  if (executionType === 'live_broadcast') {
    return (
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive ${className}`}>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
          </span>
          <div className="text-start">
            <p className="font-bold text-sm leading-tight flex items-center gap-1.5">
              <Radio className="h-4 w-4 animate-pulse" />
              {t('badgeLocked')}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('lockedStatus')}
            </p>
          </div>
        </div>

        {broadcastUrl && (
          <a
            href={broadcastUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-destructive text-white text-xs font-semibold hover:bg-destructive/90 transition-colors shadow-xs"
          >
            <span>{t('watchLiveStream')}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    );
  }

  // Automated electronic draw
  return (
    <div className={`flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 ${className}`}>
      <div className="flex items-center gap-2.5">
        <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
        <div className="text-start">
          <p className="font-bold text-sm leading-tight">
            {t('badgeLocked')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('electronicVerification')}
          </p>
        </div>
      </div>

      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 text-xs font-medium">
        <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span>{t('badgeCertified')}</span>
      </div>
    </div>
  );
}
