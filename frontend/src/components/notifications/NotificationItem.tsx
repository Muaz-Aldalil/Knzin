'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Trophy,
  Megaphone,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Clock,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { NotificationItem as NotificationItemType } from '@/types/notification';
import { sanitizeRelativePath } from '@/lib/safe-url';

interface NotificationItemProps {
  notification: NotificationItemType;
  onMarkAsRead: (id: string) => void;
  onCloseDrawer?: () => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onCloseDrawer,
}: NotificationItemProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    id,
    category,
    title,
    body,
    action_type,
    action_url,
    metadata,
    is_read,
    created_at,
  } = notification;

  // Category Icon & Color
  const getCategoryMeta = () => {
    switch (category) {
      case 'admin_sales':
        return {
          icon: TrendingUp,
          badgeColor: 'text-emerald-600 dark:text-emerald-400',
          label: isRtl ? 'مبيعات الدورات' : 'Course Sale',
        };
      case 'admin_ops':
        return {
          icon: Shield,
          badgeColor: 'text-indigo-600 dark:text-indigo-400',
          label: isRtl ? 'عمليات المنصة' : 'Platform Ops',
        };
      case 'course_announcements':
        return {
          icon: BookOpen,
          badgeColor: 'text-blue-500',
          label: isRtl ? 'دورات تدريبية' : 'Course',
        };
      case 'prize_draw_promotions':
        return {
          icon: Trophy,
          badgeColor: 'text-amber-500',
          label: isRtl ? 'سحب وجوائز' : 'Raffle & Prize',
        };
      case 'admin_broadcasts':
        return {
          icon: Megaphone,
          badgeColor: 'text-purple-500',
          label: isRtl ? 'إعلان عام' : 'Broadcast',
        };
      case 'transactional':
      default:
        return {
          icon: CheckCircle,
          badgeColor: 'text-emerald-500',
          label: isRtl ? 'معاملة رسمية' : 'Transactional',
        };
    }
  };

  const categoryMeta = getCategoryMeta();
  const Icon = categoryMeta.icon;

  // Format localized timestamp
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(isRtl ? 'ar-IQ' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Handle in-memory non-reload refresh action (User Story 7 - T053)
  const handleRefreshCourse = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);

    try {
      // 1. Optimistically mark notification as read
      if (!is_read) {
        onMarkAsRead(id);
      }

      // 2. Invalidate TanStack Query caches without full-page reload or auth disruption
      const courseSlug = metadata?.course_slug;
      if (courseSlug) {
        await queryClient.invalidateQueries({ queryKey: ['course', courseSlug] });
      }
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      await queryClient.invalidateQueries({ queryKey: ['catalog'] });
      await queryClient.invalidateQueries({ queryKey: ['learner', 'courses'] });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCardClick = () => {
    if (!is_read) {
      onMarkAsRead(id);
    }
    if (action_type === 'navigate' && action_url) {
      onCloseDrawer?.();
      const safePath = sanitizeRelativePath(action_url, '');
      if (safePath) {
        router.push(safePath);
      }
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative p-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
        is_read
          ? 'bg-surface/40 hover:bg-surface border-border-subtle hover:border-border text-content-secondary'
          : 'bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/30 text-content-primary shadow-2xs'
      }`}
    >
      {/* Header Row: Category Badge, Unread Indicator & Timestamp */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {!is_read && (
            <span
              className="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20 shrink-0"
              aria-label={isRtl ? 'غير مقروء' : 'Unread'}
              data-testid="notification-unread-dot"
            />
          )}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold ${categoryMeta.badgeColor}`}
          >
            <Icon className="w-3 h-3" />
            <span>{categoryMeta.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-content-muted shrink-0">
          <Clock className="w-3 h-3" />
          <span>{formatTime(created_at)}</span>
        </div>
      </div>

      {/* Title with BDI */}
      <h4 className="text-xs sm:text-sm font-semibold text-content-primary mb-1 leading-snug">
        <bdi>{title}</bdi>
      </h4>

      {/* Body with BDI */}
      <p className="text-xs text-content-secondary leading-relaxed mb-3">
        <bdi>{body}</bdi>
      </p>

      {/* Action Area */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border-subtle/50">
        <div>
          {action_type === 'refresh_course' && (
            <button
              type="button"
              onClick={handleRefreshCourse}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title={isRtl ? 'تحديث محتوى الدورة فوراً' : 'Refresh course content immediately'}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>{isRtl ? 'تحديث المحتوى' : 'Refresh Content'}</span>
            </button>
          )}

          {action_type === 'navigate' && action_url && (
            <span className="inline-flex items-center gap-1 text-xs text-primary font-medium group-hover:underline">
              <span>{isRtl ? 'عرض التفاصيل' : 'View Details'}</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Mark as read button if unread */}
        {!is_read && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(id);
            }}
            className="text-[11px] text-content-muted hover:text-primary transition-colors cursor-pointer"
            title={isRtl ? 'تحديد كمقروء' : 'Mark as read'}
          >
            {isRtl ? 'تحديد كمقروء' : 'Mark as read'}
          </button>
        )}
      </div>
    </div>
  );
}
