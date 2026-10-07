'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Bell,
  CheckCheck,
  Settings,
  Inbox,
  Loader2,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { NotificationPreferencesModal } from '@/components/notifications/NotificationPreferencesModal';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAccess } from '@/hooks/admin/useAdminAccess';

export default function NotificationsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [activeScope, setActiveScope] = useState<'learner' | 'admin'>('learner');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const { token } = useAuth();
  const { isAdmin } = useAdminAccess(token);
  const currentScope = isAdmin ? activeScope : 'all';

  const {
    notifications,
    isLoading,
    unreadCount,
    learnerUnreadCount,
    adminUnreadCount,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
  } = useNotifications(1, 50, filter, currentScope);

  const activeScopeUnreadCount = isAdmin
    ? activeScope === 'admin'
      ? adminUnreadCount
      : learnerUnreadCount
    : unreadCount;

  return (
    <div className="min-h-[75vh] py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-content-secondary hover:text-content-primary transition-colors"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isRtl ? 'العودة إلى لوحة المتدرب' : 'Back to Dashboard'}</span>
        </Link>
      </div>

      {/* Dual-Persona Persona Selector (Rendered ONLY for Administrators - US2, FR-009) */}
      {isAdmin && (
        <div className="flex items-center gap-2 mb-6 p-1.5 bg-surface-secondary/60 rounded-xl border border-border-subtle max-w-md">
          <button
            type="button"
            onClick={() => setActiveScope('learner')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
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
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
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
      )}

      {/* Header HUD Card */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-content-primary">
                  {isAdmin && activeScope === 'admin'
                    ? isRtl
                      ? 'تنبيهات الإدارة والمبيعات'
                      : 'Admin & Sales Alerts'
                    : isRtl
                      ? 'مركز الإشعارات والتنبيهات'
                      : 'Notification Center'}
                </h1>
                {unreadCount > 0 && (
                  <span className="text-xs font-bold text-primary">
                    <bdi>{unreadCount}</bdi> {isRtl ? 'جديد' : 'new'}
                  </span>
                )}
              </div>
              <p className="text-xs text-content-muted mt-1">
                {isAdmin && activeScope === 'admin'
                  ? isRtl
                    ? 'متابعة مبيعات الدورات في الوقت الفعلي والعمليات الإدارية الحيوية'
                    : 'Real-time course sales alerts and critical administrative events'
                  : isRtl
                    ? 'متابعة تنبيهات طلباتك، أرقام تذاكرك، والمفاجآت الحصرية'
                    : 'Track your orders, tickets, live draws, and course updates'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {activeScopeUnreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead(currentScope)}
                disabled={isMarkingAllAsRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isMarkingAllAsRead ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                <span>{isRtl ? 'تحديد الكل كمقروء' : 'Mark all read'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPreferencesOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-content-secondary hover:text-content-primary bg-surface-secondary hover:bg-surface-elevated border border-border-subtle transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{isRtl ? 'التفضيلات' : 'Preferences'}</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-content-muted hover:text-content-primary hover:bg-surface-secondary'
            }`}
          >
            {isRtl ? 'جميع الإشعارات' : 'All Notifications'}
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'unread'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-content-muted hover:text-content-primary hover:bg-surface-secondary'
            }`}
          >
            <span>{isRtl ? 'غير المقروءة' : 'Unread'}</span>
            {activeScopeUnreadCount > 0 && (
              <span
                className={`text-[10px] font-bold ${
                  filter === 'unread' ? 'text-white' : 'text-primary'
                }`}
              >
                <bdi>{activeScopeUnreadCount}</bdi>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications List Body */}
      <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-content-muted">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <span className="text-xs">{isRtl ? 'جاري تحميل الإشعارات...' : 'Loading notifications...'}</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-secondary border border-border-subtle flex items-center justify-center text-content-muted mb-4">
              <Inbox className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-content-primary">
              {isAdmin && activeScope === 'admin'
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
                    ? 'صندوق الإشعارات فارغ حالياً'
                    : 'Your notifications inbox is empty'}
            </p>
            <p className="text-xs text-content-muted mt-1 max-w-sm">
              {isAdmin && activeScope === 'admin'
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
                    ? 'ستظهر هنا إشعاراتك عند تأكيد طلبات الشراء، إصدار أرقام التذاكر، وبدء السحوبات الترويجية المباشرة.'
                    : 'You will receive updates here regarding your orders, ticket draws, and course reminders.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {notifications.map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                onMarkAsRead={markAsRead}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />
    </div>
  );
}
