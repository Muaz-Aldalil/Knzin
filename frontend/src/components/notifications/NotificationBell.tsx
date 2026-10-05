'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  isOpen?: boolean;
}

export function NotificationBell({
  unreadCount,
  onClick,
  isOpen = false,
}: NotificationBellProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const badgeText = unreadCount > 99 ? '99+' : unreadCount.toString();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center p-2 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-secondary text-xs font-medium transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-primary/40 ${
        isOpen ? 'bg-surface-secondary text-primary' : ''
      }`}
      aria-label={
        isRtl
          ? `مركز الإشعارات (${unreadCount} غير مقروء)`
          : `Notification Center (${unreadCount} unread)`
      }
      title={
        isRtl
          ? `مركز الإشعارات (${unreadCount} غير مقروء)`
          : `Notification Center (${unreadCount} unread)`
      }
    >
      <Bell className={`w-4 h-4 transition-transform ${unreadCount > 0 ? 'text-primary' : 'text-content-muted'}`} />

      {unreadCount > 0 && (
        <span
          className={`absolute -top-1 ${
            isRtl ? '-left-1' : '-right-1'
          } min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse ring-2 ring-surface`}
        >
          <bdi>{badgeText}</bdi>
        </span>
      )}
    </button>
  );
}
