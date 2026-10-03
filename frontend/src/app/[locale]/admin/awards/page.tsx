'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AwardForm } from '@/components/admin/AwardForm';
import { Gift } from 'lucide-react';

export default function AdminAwardsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <div className="space-y-6" data-testid="admin-awards-page">
        <div>
          <h1 className="text-2xl font-bold text-content-primary flex items-center gap-3">
            <Gift className="w-7 h-7 text-brand-gold" />
            <span>{isAr ? 'منح الجوائز والتذاكر الترويجية' : 'Promotional Awards & Grants'}</span>
          </h1>
          <p className="text-sm text-content-secondary mt-1">
            {isAr
              ? 'إصدار تذاكر أو منح ترويجية إدارية خاصة للمستخدمين مع حفظ التبرير الإلزامي في سجل التدقيق.'
              : 'Issue discretionary promotional tickets or rewards to eligible users with mandatory audit trail.'}
          </p>
        </div>

        <AwardForm />
      </div>
    </AdminGuard>
  );
}
