'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { useSiteWideCms } from '@/hooks/admin/useAdminCms';
import { ActivityEventType, ActivityEvent } from '@/types/activity';

function getBadgeStyles(type: ActivityEventType): string {
  switch (type) {
    case 'enrollment':
      return 'text-emerald-600 dark:text-emerald-400 font-bold';
    case 'countdown_alert':
      return 'text-amber-600 dark:text-amber-400 font-bold';
    case 'bulletin':
    default:
      return 'text-blue-600 dark:text-blue-400 font-bold';
  }
}

export function ActivityTicker() {
  const locale = useLocale();
  const t = useTranslations('ticker');
  const { events } = useActivityFeed();
  const { data: cmsData } = useSiteWideCms();
  const siteShell = cmsData?.sections?.site_shell;

  if (siteShell && siteShell.ticker_enabled === false) {
    return null;
  }

  // Map CMS announcements if present
  const cmsEvents: ActivityEvent[] = (siteShell?.ticker_announcements || []).map((item) => ({
    id: `cms_${item.id}`,
    type: 'bulletin' as ActivityEventType,
    text_ar: item.text_ar,
    text_en: item.text_en,
    highlight_label_ar: (locale === 'ar' ? item.highlight_label_ar : item.highlight_label_en) || (locale === 'ar' ? 'إعلان المنصة' : 'Announcement'),
    highlight_label_en: item.highlight_label_en || 'Announcement',
    timestamp: new Date().toISOString(),
  }));

  const combinedEvents = [...cmsEvents, ...events];
  const displayEvents = combinedEvents.length > 0 ? combinedEvents : [];

  return (
    <div
      role="region"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      aria-label={locale === 'ar' ? 'شريط النشاط المباشر' : 'Live Activity Ticker'}
      className="h-10 w-full bg-surface-secondary/85 backdrop-blur-xs border-b border-border-subtle overflow-hidden relative flex items-center group z-30 select-none"
    >
      {/* Visual pulse & Live indicator tag */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-surface-primary border-e border-border-subtle text-primary font-bold text-xs uppercase tracking-wider z-10 shadow-xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span className="text-[11px] font-semibold">{t('badge')}</span>
      </div>

      {/* Marquee Track with hover/focus pause & bdi isolation */}
      <div className="flex-1 overflow-hidden relative ticker-viewport">
        <div
          tabIndex={0}
          aria-label={locale === 'ar' ? 'إعلانات النشاط الجارية' : 'Ongoing activity announcements'}
          className="animate-marquee flex items-center whitespace-nowrap group-hover:[animation-play-state:paused] focus:[animation-play-state:paused] focus-within:[animation-play-state:paused] focus-visible:outline-hidden"
        >
          {/* Duplicate items twice to guarantee seamless infinite looping */}
          {[...displayEvents, ...displayEvents].map((event, idx) => {
            const isAr = locale === 'ar';
            const label = isAr ? event.highlight_label_ar : event.highlight_label_en;
            const text = isAr ? event.text_ar : event.text_en;

            return (
              <div
                key={`${event.id}-${idx}`}
                className="inline-flex items-center gap-2 mx-5 text-xs text-content-primary"
              >
                <span
                  className={`inline-flex items-center text-[11px] ${getBadgeStyles(
                    event.type
                  )}`}
                >
                  {label}
                </span>
                <bdi className="font-medium text-content-primary hover:text-primary transition-colors">
                  {text}
                </bdi>
                <span className="text-content-muted/40 mx-2 select-none" aria-hidden="true">
                  •
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
