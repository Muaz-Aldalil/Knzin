'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { useAdminAuditLogs, AuditLogFilters } from '@/hooks/admin/useAdminAuditLogs';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import { AuditLogFilterControls } from '@/components/admin/AuditLogFilters';
import { ScrollText, ShieldAlert } from 'lucide-react';

export default function AdminAuditPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [filters, setFilters] = useState<AuditLogFilters>({});
  const { logs, isLoading, refetch } = useAdminAuditLogs(filters);

  return (
    <AdminGuard requiredCapability="manage_admin_capabilities">
      <div className="space-y-6" data-testid="admin-audit-page">
        <div>
          <h1 className="text-2xl font-bold text-content-primary flex items-center gap-3">
            <ScrollText className="w-7 h-7 text-brand-gold" />
            <span>{isAr ? 'سجل الرقابة والعمليات الأمنية الموحد' : 'Unified Security Audit Trail'}</span>
          </h1>
          <p className="text-sm text-content-secondary mt-1">
            {isAr
              ? 'سجل غير قابل للتعديل أو الحذف، يوثق كافة العمليات الإدارية مع تنقيح تلقائي للمعلومات الحساسة.'
              : 'Immutable, append-only operational audit trail with automatic cryptographic PII redaction.'}
          </p>
        </div>

        {/* Filters */}
        <AuditLogFilterControls filters={filters} onFilterChange={(f) => setFilters(f)} />

        {/* Audit Table */}
        <AuditLogTable logs={logs} isLoading={isLoading} />
      </div>
    </AdminGuard>
  );
}
