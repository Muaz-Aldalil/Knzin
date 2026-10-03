'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAdminDraws } from '@/hooks/admin/useAdminDraws';
import { DrawRecord } from '@/types/admin';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { formatDate } from '@/lib/admin/format';
import { Sparkles, Plus, Eye, Lock, Edit3 } from 'lucide-react';

export default function AdminDrawsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [statusFilter, setStatusFilter] = useState('all');
  const { draws, isLoading, refetch } = useAdminDraws(statusFilter);

  const columns: Column<DrawRecord>[] = [
    {
      key: 'id',
      header: isAr ? 'المعرف' : 'ID',
      render: (item) => <span className="font-mono text-xs font-bold text-content-primary">#{item.id}</span>,
    },
    {
      key: 'title',
      header: isAr ? 'عنوان السحب' : 'Title',
      render: (item) => (
        <div>
          <span className="font-bold text-content-primary block">{isAr ? item.title_ar : item.title_en}</span>
          <span className="text-xs text-brand-gold capitalize">{item.tier} • {item.execution_type}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'is_published',
      header: isAr ? 'النشر' : 'Visibility',
      render: (item) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            item.is_published
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
          }`}
        >
          {item.is_published ? (isAr ? 'منشور' : 'Published') : (isAr ? 'مسودة' : 'Draft')}
        </span>
      ),
    },
    {
      key: 'commitment',
      header: isAr ? 'الالتزام التشفيري' : 'Cryptographic Proof',
      render: (item) => (
        <div className="text-xs">
          {(item.server_seed_hash || item.seed_commitment_hash) ? (
            <div className="flex items-center gap-1 font-mono text-[11px] text-brand-gold">
              <Lock className="w-3 h-3 text-brand-gold shrink-0" />
              <span>{(item.server_seed_hash || item.seed_commitment_hash)!.slice(0, 10)}...</span>
            </div>
          ) : (
            <span className="text-content-muted">{isAr ? 'غير مولد' : 'Not generated'}</span>
          )}
        </div>
      ),
    },
    {
      key: 'dates',
      header: isAr ? 'فترة السحب' : 'Window',
      render: (item) => (
        <div className="text-xs text-content-secondary">
          <span>{formatDate(item.starts_at, locale)}</span>
          <span className="block text-content-muted">→ {formatDate(item.ends_at, locale)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: isAr ? 'الإجراءات' : 'Actions',
      render: (item) => (
        <Link
          href={`/${locale}/admin/draws/${item.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-bold text-content-primary transition-colors"
          data-testid={`manage-draw-${item.id}`}
        >
          <Edit3 className="w-3.5 h-3.5 text-brand-gold" />
          <span>{isAr ? 'إدارة السحب' : 'Manage'}</span>
        </Link>
      ),
    },
  ];

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <div className="space-y-6" data-testid="admin-draws-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-brand-gold" />
              <span>{isAr ? 'إدارة السحوبات والجوائز الترويجية' : 'Promotional Draws & Prizes'}</span>
            </h1>
            <p className="text-sm text-content-secondary mt-1">
              {isAr
                ? 'إدارة مواعيد السحوبات، إضافة الجوائز، نشر الالتزام المشفر وكشف البذرة بعد الانتهاء.'
                : 'Configure draw schedules, attach prizes, publish seed commitments, and complete verified draws.'}
            </p>
          </div>

          <Link
            href={`/${locale}/admin/draws/new`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gold text-brand-navy font-bold text-sm hover:bg-brand-gold-light transition-colors shadow-xs"
            data-testid="create-draw-button"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إنشاء مسودة سحب جديدة' : 'Create Draw Draft'}</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-border-subtle text-xs w-fit">
          {['all', 'upcoming', 'locked', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors capitalize ${
                statusFilter === status
                  ? 'bg-brand-gold text-brand-navy shadow-xs'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              {status === 'all' ? (isAr ? 'الكل' : 'All') : status}
            </button>
          ))}
        </div>

        {/* Draws Table */}
        <DataTable
          columns={columns}
          data={draws}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage={isAr ? 'لا توجد سحوبات مطابقة.' : 'No draws found.'}
        />
      </div>
    </AdminGuard>
  );
}
