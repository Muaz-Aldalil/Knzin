'use client';

import React, { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  shouldTriggerNavigation,
  getTransformOrigin,
  getNextTrickleProgress,
} from '@/lib/navigation/progress-utils';

/**
 * Custom programmatic dispatchers for client-side navigation progress.
 */
export function startNavigationProgress() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('knzin:navigate-start'));
  }
}

export function completeNavigationProgress() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('knzin:navigate-complete'));
  }
}

function NavigationProgressBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const [state, setState] = useState<'idle' | 'loading' | 'completing'>('idle');
  const [progress, setProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isRtl, setIsRtl] = useState(locale === 'ar');

  const trickleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const isMountedRef = useRef(false);

  // Sync RTL state with locale or document direction
  useEffect(() => {
    const isDocRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    setIsRtl(locale === 'ar' || isDocRtl);
  }, [locale]);

  // Monitor prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const clearTimers = useCallback(() => {
    if (trickleTimerRef.current) {
      clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimers();
    startTimeRef.current = Date.now();
    setState('loading');
    setProgress(0.2); // Initial immediate feedback jump to 20%

    // Setup trickling interval
    trickleTimerRef.current = setInterval(() => {
      setProgress((prev) => getNextTrickleProgress(prev, Math.random()));
    }, 200);
  }, [clearTimers]);

  const complete = useCallback(() => {
    if (trickleTimerRef.current) {
      clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }

    const elapsed = Date.now() - startTimeRef.current;
    const minDisplayDuration = 180; // Avoid jarring flash on instantaneous transitions
    const remainingHold = Math.max(0, minDisplayDuration - elapsed);

    finishTimeoutRef.current = setTimeout(() => {
      setProgress(1.0); // Complete to 100%
      setState('completing');

      // Allow 200ms for scale animation to 100%, then fade out cleanly
      finishTimeoutRef.current = setTimeout(() => {
        setState('idle');
        setProgress(0);
      }, 350);
    }, remainingHold);
  }, []);

  // Track route completion via Next.js pathname and searchParams changes
  const currentUrl = `${pathname}?${searchParams?.toString() || ''}`;
  const previousUrlRef = useRef(currentUrl);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      previousUrlRef.current = currentUrl;
      return;
    }

    if (previousUrlRef.current !== currentUrl) {
      previousUrlRef.current = currentUrl;
      if (state === 'loading') {
        complete();
      }
    }
  }, [currentUrl, state, complete]);

  // Safety auto-cleanup timeout (in case of cancelled navigations)
  useEffect(() => {
    if (state === 'loading') {
      const safetyTimeout = setTimeout(() => {
        complete();
      }, 8000);
      return () => clearTimeout(safetyTimeout);
    }
  }, [state, complete]);

  // Global document click, popstate, and custom event listeners
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest('a');
      if (!target) return;

      const isModified = Boolean(
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      );

      const shouldTrigger = shouldTriggerNavigation({
        currentUrl: new URL(window.location.href),
        targetHref: target.getAttribute('href') || '',
        isModifiedEvent: isModified,
        button: event.button,
        defaultPrevented: event.defaultPrevented,
        targetAttr: target.target,
        downloadAttr: target.hasAttribute('download'),
        relAttr: target.getAttribute('rel'),
      });

      if (shouldTrigger) {
        start();
      }
    };

    const handlePopState = () => {
      // Browser back/forward navigation
      start();
    };

    const handleCustomStart = () => start();
    const handleCustomComplete = () => complete();

    document.addEventListener('click', handleClick, { capture: true });
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('knzin:navigate-start', handleCustomStart);
    window.addEventListener('knzin:navigate-complete', handleCustomComplete);

    return () => {
      clearTimers();
      document.removeEventListener('click', handleClick, { capture: true });
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('knzin:navigate-start', handleCustomStart);
      window.removeEventListener('knzin:navigate-complete', handleCustomComplete);
    };
  }, [start, complete, clearTimers]);

  const transformOrigin = getTransformOrigin(locale, isRtl);

  // Transition calculation respecting prefers-reduced-motion
  let transitionStyle = 'none';
  if (state === 'loading') {
    transitionStyle = prefersReducedMotion
      ? 'opacity 150ms ease'
      : 'transform 200ms ease-out, opacity 150ms ease';
  } else if (state === 'completing') {
    transitionStyle = prefersReducedMotion
      ? 'opacity 200ms ease'
      : 'transform 200ms ease-out, opacity 200ms ease 120ms';
  }

  const opacityStyle = state === 'completing' ? 0 : state === 'loading' ? 1 : 0;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[2.5px] overflow-hidden"
      role="progressbar"
      aria-hidden={state === 'idle'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <div
        className="h-full w-full bg-primary"
        style={{
          backgroundColor: 'var(--color-primary, #1877f2)',
          transformOrigin,
          transform: prefersReducedMotion ? 'none' : `scaleX(${progress})`,
          opacity: opacityStyle,
          transition: transitionStyle,
          willChange: state === 'idle' ? 'auto' : 'transform, opacity',
        }}
      />
    </div>
  );
}

/**
 * Centralized, minimal client-side navigation progress bar.
 * Sits at absolute top edge of the viewport, above the navbar (z-[9999]).
 * Originates from right in RTL (Arabic) and left in LTR (English).
 */
export default function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBarContent />
    </Suspense>
  );
}
