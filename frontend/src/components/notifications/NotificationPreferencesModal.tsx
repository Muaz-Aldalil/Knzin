'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ShieldCheck, Bell, Loader2, Check } from 'lucide-react';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/api/notifications';
import { NotificationPreferences } from '@/types/notification';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPreferencesModal({
  isOpen,
  onClose,
}: NotificationPreferencesModalProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const queryClient = useQueryClient();

  const [userEdits, setUserEdits] = useState<Partial<NotificationPreferences>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: fetchNotificationPreferences,
    enabled: isOpen,
  });

  const formState: NotificationPreferences = {
    course_announcements: true,
    prize_draw_promotions: true,
    admin_broadcasts: true,
    is_unsubscribed_from_all: false,
    ...data?.data,
    ...userEdits,
  };

  const updateMutation = useMutation({
    mutationFn: (updated: Partial<NotificationPreferences>) =>
      updateNotificationPreferences(updated),
    onSuccess: (res) => {
      queryClient.setQueryData(['notifications', 'preferences'], res);
      setUserEdits({});
      onClose();
    },
  });

  if (!isOpen) return null;

  const handleToggle = (key: keyof NotificationPreferences) => {
    setUserEdits((prev) => ({
      ...prev,
      [key]: !formState[key],
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(formState);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative z-10 w-full max-w-md bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden text-content-primary"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-subtle flex items-center justify-between bg-surface-secondary/40">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm sm:text-base">
              {isRtl ? 'تفضيلات الإشعارات والتسويق' : 'Notification & Marketing Preferences'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center text-content-muted">
              <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
              <p>{isRtl ? 'جارٍ تحميل التفضيلات...' : 'Loading preferences...'}</p>
            </div>
          ) : (
            <>
              {/* Mandatory Transactional Notice */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-semibold mb-0.5">
                    {isRtl ? 'الإشعارات الإلزامية نشطة دائماً' : 'Mandatory Transactional Notices'}
                  </p>
                  <p className="opacity-90">
                    {isRtl
                      ? 'تأكيدات الشراء، أرقام التذاكر الترويجية، وتنبيهات السحب المباشر تصلك دائماً لحماية حقوقك.'
                      : 'Order receipts, sweepstakes ticket grants, and draw stream alerts are mandatory for security.'}
                  </p>
                </div>
              </div>

              {/* Category 1: Course Announcements */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border-subtle bg-surface hover:bg-surface-secondary/50 transition-colors">
                <div>
                  <h4 className="font-semibold text-content-primary text-xs sm:text-sm">
                    {isRtl ? 'إعلانات الدورات التعليمية' : 'New Course Announcements'}
                  </h4>
                  <p className="text-[11px] text-content-muted">
                    {isRtl
                      ? 'تنبيهات فورية عند إطلاق برامج مهنية ودورات جديدة.'
                      : 'Alerts when new vocational courses and learning tracks launch.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('course_announcements')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formState.course_announcements ? 'bg-primary' : 'bg-surface-secondary'
                  }`}
                  role="switch"
                  aria-checked={formState.course_announcements}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formState.course_announcements ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Category 2: Prize & Draw Promotions */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border-subtle bg-surface hover:bg-surface-secondary/50 transition-colors">
                <div>
                  <h4 className="font-semibold text-content-primary text-xs sm:text-sm">
                    {isRtl ? 'عروض الجوائز وسحوبات الحظ' : 'Prize & Draw Announcements'}
                  </h4>
                  <p className="text-[11px] text-content-muted">
                    {isRtl
                      ? 'إشعارات بإطلاق جوائز كبرى جديدة وتفاصيل السحوبات.'
                      : 'Alerts for marquee prizes and scheduled promotional draws.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('prize_draw_promotions')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formState.prize_draw_promotions ? 'bg-primary' : 'bg-surface-secondary'
                  }`}
                  role="switch"
                  aria-checked={formState.prize_draw_promotions}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formState.prize_draw_promotions ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Category 3: Admin Broadcasts */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border-subtle bg-surface hover:bg-surface-secondary/50 transition-colors">
                <div>
                  <h4 className="font-semibold text-content-primary text-xs sm:text-sm">
                    {isRtl ? 'تحديثات المنصة العامة' : 'General Platform Broadcasts'}
                  </h4>
                  <p className="text-[11px] text-content-muted">
                    {isRtl
                      ? 'الرسائل الترويجية والتحديثات الشاملة الصادرة من الإدارة.'
                      : 'Platform-wide announcements and promotional messages.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('admin_broadcasts')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formState.admin_broadcasts ? 'bg-primary' : 'bg-surface-secondary'
                  }`}
                  role="switch"
                  aria-checked={formState.admin_broadcasts}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formState.admin_broadcasts ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border-subtle flex items-center justify-end gap-2 bg-surface-secondary/40">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending || isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{isRtl ? 'حفظ التفضيلات' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
