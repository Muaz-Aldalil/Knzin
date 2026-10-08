'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { useAdminSettings } from '@/hooks/admin/useAdminSettings';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Loader2, Settings as SettingsIcon } from 'lucide-react';

export default function AdminSettingsPage() {
  const { settings, isLoading, isError, error } = useAdminSettings();
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <div className="space-y-6" data-testid="admin-settings-page">
        <div>
          <h1 className="text-2xl font-bold text-content-primary flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-primary" />
            <span>{isAr ? 'إعدادات المنصة والعمولات' : 'Platform Settings & Commissions'}</span>
          </h1>
          <p className="text-sm text-content-secondary mt-1">
            {isAr
              ? 'التحكم في نسبة عمولة التسويق والحدود المالية مع حفظ كامل لسجلات التدقيق.'
              : 'Configure affiliate commission rates and operational thresholds with full audit trail.'}
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-content-secondary">
              {isAr ? 'جارِ تحميل الإعدادات...' : 'Loading settings...'}
            </p>
          </div>
        ) : isError ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error?.message || (isAr ? 'حدث خطأ أثناء تحميل الإعدادات.' : 'Failed to load settings.')}
          </div>
        ) : settings ? (
          <SettingsForm settings={settings} />
        ) : null}
      </div>
    </AdminGuard>
  );
}
