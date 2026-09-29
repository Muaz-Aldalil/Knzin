'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CountdownTimeRemaining } from '@/types/draws';

interface UseCountdownOptions {
  targetDate: string; // ISO 8601 string
  serverTimeUtc?: string; // Authoritative reference from server
  onExpire?: () => void;
}

export interface CountdownState extends CountdownTimeRemaining {
  formattedDays: string;
  formattedHours: string;
  formattedMinutes: string;
  formattedSeconds: string;
}

export function useCountdown({
  targetDate,
  serverTimeUtc,
  onExpire,
}: UseCountdownOptions): CountdownState {
  // Compute initial clock drift offset between client and server reference
  const serverOffsetMs = useMemo(() => {
    if (!serverTimeUtc) return 0;
    const serverMs = Date.parse(serverTimeUtc);
    if (isNaN(serverMs)) return 0;
    return serverMs - Date.now();
  }, [serverTimeUtc]);

  const targetMs = useMemo(() => {
    const ms = Date.parse(targetDate);
    return isNaN(ms) ? 0 : ms;
  }, [targetDate]);

  const calculateRemaining = useCallback((): CountdownTimeRemaining => {
    const effectiveNow = Date.now() + serverOffsetMs;
    const diffMs = targetMs - effectiveNow;

    if (diffMs <= 0 || targetMs === 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isLocked: true,
        totalSeconds: 0,
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      days,
      hours,
      minutes,
      seconds,
      isLocked: false,
      totalSeconds,
    };
  }, [serverOffsetMs, targetMs]);

  const [remaining, setRemaining] = useState<CountdownTimeRemaining>(() => calculateRemaining());

  useEffect(() => {
    // Initial sync
    const initial = calculateRemaining();
    setRemaining(initial);
    if (initial.isLocked && onExpire) {
      onExpire();
    }

    const tick = () => {
      const next = calculateRemaining();
      setRemaining(next);

      if (next.isLocked && onExpire) {
        onExpire();
      }
    };

    // 1-second interval
    const intervalId = setInterval(tick, 1000);

    // Mobile background tab wake listener (re-syncs immediately upon tab active)
    const handleWake = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleWake);
    window.addEventListener('focus', handleWake);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleWake);
      window.removeEventListener('focus', handleWake);
    };
  }, [calculateRemaining, onExpire]);

  // Formatted two-digit zero-padded strings
  const formattedDays = useMemo(() => String(remaining.days).padStart(2, '0'), [remaining.days]);
  const formattedHours = useMemo(() => String(remaining.hours).padStart(2, '0'), [remaining.hours]);
  const formattedMinutes = useMemo(() => String(remaining.minutes).padStart(2, '0'), [remaining.minutes]);
  const formattedSeconds = useMemo(() => String(remaining.seconds).padStart(2, '0'), [remaining.seconds]);

  return {
    ...remaining,
    formattedDays,
    formattedHours,
    formattedMinutes,
    formattedSeconds,
  };
}
