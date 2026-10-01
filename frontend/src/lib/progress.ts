import { apiClient } from '@/lib/api-client';

export interface ActiveLearningData {
  course_slug: string;
  course_title_ar: string;
  course_title_en: string;
  cover_image_url: string;
  part_number: number;
  part_title_ar: string;
  part_title_en: string;
  watch_seconds: number;
  percent_complete: number;
  is_completed: boolean;
  last_watched_at: string | null;
}

export async function saveLessonProgress(
  courseSlug: string,
  partNumber: number,
  watchSeconds: number,
  percentComplete: number
): Promise<void> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('knzin_auth_token');
    if (!token || token === 'null' || token === 'undefined') {
      return;
    }
  }

  try {
    await apiClient('/progress', {
      method: 'POST',
      body: JSON.stringify({
        course_slug: courseSlug,
        part_number: partNumber,
        watch_seconds: Math.round(watchSeconds),
        percent_complete: Math.min(100, Math.max(0, Math.round(percentComplete))),
      }),
    });
  } catch (err) {
    // Graceful degradation when offline or unauthenticated
    console.warn('[Progress] Failed to persist progress to server:', err);
  }
}

/**
 * Fetch authoritative active learning continuation state.
 * Returns null when unauthenticated or when no active progress exists (eliminating DEF-05D).
 */
export async function fetchActiveLearning(): Promise<ActiveLearningData | null> {
  if (typeof window !== 'undefined') {
    if (localStorage.getItem('knzin_guest_mode') === 'true') {
      return null;
    }

    const token = localStorage.getItem('knzin_auth_token');
    if (!token || token === 'null' || token === 'undefined') {
      return null;
    }

    try {
      const res = await apiClient<{ active_learning: ActiveLearningData | null }>(
        '/user/active-learning'
      );
      return res?.active_learning ?? null;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Fetch authoritative course progress for all parts of a course.
 * Returns empty object when unauthenticated or when no progress exists.
 */
export async function fetchCourseProgress(
  courseSlug: string
): Promise<Record<number, { percent_complete: number; is_completed: boolean; watch_seconds: number }>> {
  if (typeof window !== 'undefined') {
    if (localStorage.getItem('knzin_guest_mode') === 'true') {
      return {};
    }

    const token = localStorage.getItem('knzin_auth_token');
    if (!token || token === 'null' || token === 'undefined') {
      return {};
    }

    try {
      const res = await apiClient<{
        parts_progress: Record<number, { percent_complete: number; is_completed: boolean; watch_seconds: number }>;
      }>(`/courses/${courseSlug}/progress`);

      return res?.parts_progress ?? {};
    } catch {
      return {};
    }
  }

  return {};
}
