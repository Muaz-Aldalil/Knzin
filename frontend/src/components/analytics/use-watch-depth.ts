import { useState, useEffect, useRef } from 'react';
import { saveLessonProgress } from '@/lib/progress';

interface UseWatchDepthProps {
  durationSeconds: number;
  isPlaying: boolean;
  startSeconds?: number;
  courseSlug?: string;
  partNumber?: number;
  onMilestone?: (milestone: 25 | 50 | 75 | 95) => void;
}

export function useWatchDepth({
  durationSeconds,
  isPlaying,
  startSeconds = 0,
  courseSlug,
  partNumber,
  onMilestone,
}: UseWatchDepthProps) {
  const [depth, setDepth] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const accumulatedSecondsRef = useRef<number>(startSeconds);
  const lastTickRef = useRef<number | null>(null);
  const reachedMilestonesRef = useRef<Set<number>>(new Set());
  const lastSavedDepthRef = useRef<number>(0);

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
            if (courseSlug && partNumber) {
              saveLessonProgress(courseSlug, partNumber, accumulatedSecondsRef.current, currentDepth);
            }
          }
        }

        // Heartbeat persistence every 10%
        if (courseSlug && partNumber && currentDepth >= lastSavedDepthRef.current + 10) {
          lastSavedDepthRef.current = currentDepth;
          saveLessonProgress(courseSlug, partNumber, accumulatedSecondsRef.current, currentDepth);
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
