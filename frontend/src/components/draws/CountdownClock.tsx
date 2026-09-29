'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useCountdown } from '@/hooks/useCountdown';

interface CountdownClockProps {
  targetDate: string; // ISO 8601 UTC
  serverTimeUtc?: string;
  onExpire?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showDays?: boolean;
}

export function CountdownClock({
  targetDate,
  serverTimeUtc,
  onExpire,
  size = 'md',
  showDays = true,
}: CountdownClockProps) {
  const t = useTranslations('draws');

  const {
    days,
    formattedDays,
    formattedHours,
    formattedMinutes,
    formattedSeconds,
    isLocked,
  } = useCountdown({
    targetDate,
    serverTimeUtc,
    onExpire,
  });

  if (isLocked) {
    return null;
  }

  // Size variations
  const slotWidth = size === 'lg' ? 'min-w-[3.25rem] py-2 px-2.5 text-2xl md:text-3xl' : size === 'sm' ? 'min-w-[1.75rem] py-1 px-1.5 text-sm' : 'min-w-[2.4rem] py-1.5 px-2 text-lg md:text-xl';
  const labelSize = size === 'lg' ? 'text-xs' : 'text-[10px]';

  return (
    <div className="inline-flex items-center gap-1.5 md:gap-2 select-none" role="timer" aria-live="polite">
      {/* Days Slot (only if showDays is true or days > 0) */}
      {(showDays || days > 0) && (
        <>
          <div className="flex flex-col items-center">
            <div
              className={`flex items-center justify-center rounded-lg bg-surface border border-border shadow-xs font-mono font-bold tracking-tight text-foreground ${slotWidth}`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              <bdi dir="ltr">{formattedDays}</bdi>
            </div>
            <span className={`mt-1 font-medium text-muted-foreground uppercase ${labelSize}`}>
              {t('days')}
            </span>
          </div>
          <span className="text-muted-foreground font-bold text-lg mb-4">:</span>
        </>
      )}

      {/* Hours Slot */}
      <div className="flex flex-col items-center">
        <div
          className={`flex items-center justify-center rounded-lg bg-surface border border-border shadow-xs font-mono font-bold tracking-tight text-foreground ${slotWidth}`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          <bdi dir="ltr">{formattedHours}</bdi>
        </div>
        <span className={`mt-1 font-medium text-muted-foreground uppercase ${labelSize}`}>
          {t('hours')}
        </span>
      </div>

      <span className="text-muted-foreground font-bold text-lg mb-4">:</span>

      {/* Minutes Slot */}
      <div className="flex flex-col items-center">
        <div
          className={`flex items-center justify-center rounded-lg bg-surface border border-border shadow-xs font-mono font-bold tracking-tight text-foreground ${slotWidth}`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          <bdi dir="ltr">{formattedMinutes}</bdi>
        </div>
        <span className={`mt-1 font-medium text-muted-foreground uppercase ${labelSize}`}>
          {t('minutes')}
        </span>
      </div>

      <span className="text-muted-foreground font-bold text-lg mb-4">:</span>

      {/* Seconds Slot */}
      <div className="flex flex-col items-center">
        <div
          className={`flex items-center justify-center rounded-lg bg-surface border border-border shadow-xs font-mono font-bold tracking-tight text-primary ${slotWidth}`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          <bdi dir="ltr">{formattedSeconds}</bdi>
        </div>
        <span className={`mt-1 font-medium text-muted-foreground uppercase ${labelSize}`}>
          {t('seconds')}
        </span>
      </div>
    </div>
  );
}
