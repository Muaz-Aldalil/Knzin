'use client';

import { useState, useEffect, useRef } from 'react';

interface UseWatchDepthProps {
  durationSeconds: number;
  isPlaying: boolean;
  startSeconds?: number;
  onMilestone?: (milestone: 25 | 50 | 75 | 95) => void;
}

export function useWatchDepth({
  durationSeconds,
  isPlaying,
  startSeconds = 0,
  onMilestone,
}: UseWatchDepthProps) {
  const [depth, setDepth] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const accumulatedSecondsRef = useRef<number>(startSeconds);
  const lastTickRef = useRef<number | null>(null);
  const reachedMilestonesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!isPlaying || durationSeconds <= 0) {
      lastTickRef.current = null;
      return;
    }

    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      // Mitigate inactive background tabs
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        lastTickRef.current = Date.now();
        return;
      }

      const now = Date.now();
      if (lastTickRef.current) {
        const deltaSeconds = (now - lastTickRef.current) / 1000;
        accumulatedSecondsRef.current += deltaSeconds;

        const currentDepth = Math.min(
          100,
          Math.round((accumulatedSecondsRef.current / durationSeconds) * 100)
        );

        setDepth(currentDepth);

        // Check milestones: 25, 50, 75, 95
        const milestones: (25 | 50 | 75 | 95)[] = [25, 50, 75, 95];
        for (const m of milestones) {
          if (currentDepth >= m && !reachedMilestonesRef.current.has(m)) {
            reachedMilestonesRef.current.add(m);
            onMilestone?.(m);
            if (m === 95) {
              setIsCompleted(true);
            }
          }
        }
      }
      lastTickRef.current = now;
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isPlaying, durationSeconds, onMilestone]);

  return {
    depth,
    isCompleted,
  };
}
