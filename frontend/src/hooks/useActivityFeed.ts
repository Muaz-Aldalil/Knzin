'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ActivityEvent, ActivityFeedMeta } from '@/types/activity';

export const FALLBACK_ACTIVITY_EVENTS: ActivityEvent[] = [
  {
    id: 'evt_blt_e3b0c44298fc',
    type: 'bulletin',
    text_ar: 'أكثر من 1,200 ساعة تدريبية مهنية مكتملة هذا الأسبوع في كَنزين!',
    text_en: 'Over 1,200 vocational training hours completed this week on KNZiN!',
    highlight_label_ar: 'إعلان تعليمي',
    highlight_label_en: 'Platform Bulletin',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'evt_blt_a1b2c3d4e5f6',
    type: 'bulletin',
    text_ar: 'كل جزء مهني بقيمة 2$ أو باقة 10$ تمنحك تذاكر سحب مجانية ترويجية رسمية.',
    text_en: 'Every vocational course part ($2 or $10 bundle) grants official free promotional raffle tickets.',
    highlight_label_ar: 'شفافية',
    highlight_label_en: 'Transparency',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'evt_blt_f6e5d4c3b2a1',
    type: 'bulletin',
    text_ar: 'سحوبات نقدية وجوائز كبرى تُبث مباشرة على يوتيوب بنزاهة رقمية معلنة.',
    text_en: 'Cash draws and grand prizes broadcast live on YouTube with provable fairness.',
    highlight_label_ar: 'نزاهة معلنة',
    highlight_label_en: 'Fairness',
    timestamp: new Date().toISOString(),
  },
];

const FALLBACK_FEED_DATA: { events: ActivityEvent[]; meta: ActivityFeedMeta } = {
  events: FALLBACK_ACTIVITY_EVENTS,
  meta: {
    total: FALLBACK_ACTIVITY_EVENTS.length,
    has_live_orders: false,
    polled_at: new Date().toISOString(),
  },
};

export function useActivityFeed(initialData?: { events: ActivityEvent[]; meta: ActivityFeedMeta }) {
  const query = useQuery<{ events: ActivityEvent[]; meta: ActivityFeedMeta }>({
    queryKey: ['activity', 'recent'],
    queryFn: async () => {
      try {
        const result = await apiClient<{ events: ActivityEvent[]; meta: ActivityFeedMeta }>('/activity/recent');
        if (result && Array.isArray(result.events) && result.events.length > 0) {
          return result;
        }
        return FALLBACK_FEED_DATA;
      } catch (err) {
        console.warn('Backend activity feed unreachable, falling back to static bulletins', err);
        return FALLBACK_FEED_DATA;
      }
    },
    initialData: initialData ?? FALLBACK_FEED_DATA,
    staleTime: 30 * 1000,
    refetchInterval: 45 * 1000,
    refetchOnWindowFocus: true,
  });

  const events = query.data?.events ?? FALLBACK_ACTIVITY_EVENTS;
  const meta = query.data?.meta ?? FALLBACK_FEED_DATA.meta;

  return {
    events,
    meta,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
