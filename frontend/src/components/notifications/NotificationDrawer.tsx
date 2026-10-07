'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from 'next-intl';
import {
  X,
  CheckCheck,
  Settings,
  BellOff,
  Inbox,
  Loader2,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAccess } from '@/hooks/admin/useAdminAccess';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  isAdmin: isAdminProp,
}: NotificationDrawerProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [activeScope, setActiveScope] = useState<'learner' | 'admin'>('learner');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { token } = useAuth();
  const { isAdmin: probeIsAdmin } = useAdminAccess(token);
  const effectiveIsAdmin = isAdminProp !== undefined ? isAdminProp : probeIsAdmin;

  const currentScope = effectiveIsAdmin ? activeScope : 'all';

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    notifications,
    isLoading,
    unreadCount,
    learnerUnreadCount,
    adminUnreadCount,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
  } = useNotifications(1, 25, filter, currentScope);

  const activeScopeUnreadCount = effectiveIsAdmin
    ? activeScope === 'admin'
      ? adminUnreadCount
      : learnerUnreadCount
    : unreadCount;

  // Lock body scroll when drawer is open to prevent background scrolling
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`fixed inset-y-0 ${
          isRtl ? 'left-0' : 'right-0'
        } z-50 w-full sm:max-w-md h-full h-[100dvh] bg-surface border-s border-border-subtle shadow-2xl flex flex-col transform transition-transform duration-250 ease-out`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-center-title"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:px-6 border-b border-border-subtle flex items-center justify-between gap-3 bg-surface-secondary/40">
          <div className="flex items-center gap-2">
            <h3
              id="notification-center-title"
              className="text-base font-bold text-content-primary"
            >
              {isRtl ? 'مركز الإشعارات' : 'Notification Center'}
            </h3>
            {unreadCount > 0 && (
              <span className="text-xs font-bold text-primary">
                <bdi>{unreadCount}</bdi> {isRtl ? 'جديد' : 'new'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Preferences Button */}
            <button
              type="button"
              onClick={() => setIsPreferencesOpen(true)}
              className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-secondary transition-colors cursor-pointer"
              title={isRtl ? 'إعدادات الإشعارات' : 'Notification Preferences'}
              aria-label={isRtl ? 'إعدادات الإشعارات' : 'Notification Preferences'}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-secondary transition-colors cursor-pointer"
              title={isRtl ? 'إغلاق' : 'Close'}
              aria-label={isRtl ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dual-Persona Persona Selector (Rendered ONLY for Administrators - US2, FR-009) */}
        {effectiveIsAdmin && (
          <div className="px-4 sm:px-6 py-2.5 border-b border-border-subtle bg-surface-secondary/30">
            <div className="grid grid-cols-2 p-1 bg-surface-secondary rounded-xl border border-border-subtle text-xs">
              <button
                type="button"
                onClick={() => setActiveScope('learner')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                  activeScope === 'learner'
                    ? 'bg-surface text-content-primary shadow-xs'
                    : 'text-content-muted hover:text-content-primary'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-primary" />
                <span>{isRtl ? 'نشاطي كمتعلم' : 'My Activity'}</span>
                {learnerUnreadCount > 0 && (
                  <span className="text-[10px] font-bold text-primary">
                    <bdi>{learnerUnreadCount}</bdi>
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveScope('admin')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                  activeScope === 'admin'
                    ? 'bg-surface text-content-primary shadow-xs'
                    : 'text-content-muted hover:text-content-primary'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>{isRtl ? 'الإدارة والمبيعات' : 'Admin & Sales'}</span>
                {adminUnreadCount > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <bdi>{adminUnreadCount}</bdi>
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Filter Tabs & Mark All Read Action Bar */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-border-subtle flex items-center justify-between gap-3 bg-surface">
          <div className="flex items-center gap-1 p-0.5 bg-surface-secondary rounded-lg border border-border-subtle text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-surface text-content-primary shadow-2xs font-semibold'
                  : 'text-content-muted hover:text-content-primary'
              }`}
            >
              {isRtl ? 'الكل' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filter === 'unread'
                  ? 'bg-surface text-content-primary shadow-2xs font-semibold'
                  : 'text-content-muted hover:text-content-primary'
              }`}
            >
              {isRtl ? 'غير المقروءة' : 'Unread'}
            </button>
          </div>

          {activeScopeUnreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead(currentScope)}
              disabled={isMarkingAllAsRead}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-content-muted hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{isRtl ? 'تحديد الكل كمقروء' : 'Mark all as read'}</span>
            </button>
          )}
        </div>

        {/* Scrollable Notification List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-content-muted">
              <Loader2 className="w-6 h-6 animate-spin text-primary mb-3" />
              <p className="text-xs">{isRtl ? 'جارٍ تحميل الإشعارات...' : 'Loading notifications...'}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center text-content-muted">
              <div className="w-12 h-12 rounded-2xl bg-surface-secondary flex items-center justify-center mb-3 text-content-muted">
                {filter === 'unread' ? (
                  <BellOff className="w-6 h-6" />
                ) : (
                  <Inbox className="w-6 h-6" />
                )}
              </div>
              <h4 className="text-sm font-semibold text-content-primary mb-1">
                {effectiveIsAdmin && activeScope === 'admin'
                  ? filter === 'unread'
                    ? isRtl
                      ? 'لا توجد تنبيهات مبيعات غير مقروءة'
                      : 'No unread sales alerts'
                    : isRtl
                      ? 'لا توجد تنبيهات إدارية حالياً'
                      : 'No administrative alerts yet'
                  : filter === 'unread'
                    ? isRtl
                      ? 'لا توجد إشعارات غير مقروءة'
                      : 'No unread notifications'
                    : isRtl
                      ? 'صندوق الإشعارات فارغ'
                      : 'Your inbox is empty'}
              </h4>
              <p className="text-xs max-w-xs leading-relaxed">
                {effectiveIsAdmin && activeScope === 'admin'
                  ? filter === 'unread'
                    ? isRtl
                      ? 'لقد اطلعت على كافة تنبيهات مبيعات الدورات بنجاح.'
                      : "You're all caught up with your sales alerts."
                    : isRtl
                      ? 'ستصلك هنا إشعارات فورية بمبيعات الدورات وتحديثات المنصة الإدارية.'
                      : 'You will receive real-time notifications for course purchases and administrative events here.'
                  : filter === 'unread'
                    ? isRtl
                      ? 'لقد اطلعت على جميع التحديثات والإشعارات بنجاح.'
                      : "You're all caught up with your latest updates."
                    : isRtl
                      ? 'ستصلك هنا إشعارات دوراتك التعليمية وتذاكر السحب فور توفرها.'
                      : 'Updates on your courses, draws, and tickets will appear here.'}
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onCloseDrawer={onClose}
              />
            ))
          )}
        </div>
      </div>

      {/* Preferences Modal (Phase 8 - T049) */}
      <NotificationPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />
    </>,
    document.body
  );
}
