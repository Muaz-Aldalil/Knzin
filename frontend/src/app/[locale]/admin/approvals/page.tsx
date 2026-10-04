'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { useAdminApprovals, AdminApprovalRecord } from '@/hooks/admin/useAdminApprovals';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { ApprovalForm } from '@/components/admin/ApprovalForm';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { formatDate } from '@/lib/admin/format';
import { ShieldCheck, UserCheck, Sparkles, XCircle } from 'lucide-react';

export default function AdminApprovalsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [filterType, setFilterType] = useState('all');
  const [revokingApproval, setRevokingApproval] = useState<AdminApprovalRecord | null>(null);

  const { approvals, isLoading, revokeApproval, isRevoking, refetch } = useAdminApprovals(filterType);

  const handleRevoke = async (reason: string) => {
    if (!revokingApproval) return;
    await revokeApproval({
      approval_id: revokingApproval.approval_id,
      reason,
    });
    setRevokingApproval(null);
  };

  const columns: Column<AdminApprovalRecord>[] = [
    {
      key: 'approval_id',
      header: isAr ? 'رقم الموافقة' : 'Approval ID',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-content-primary">
          {item.approval_id}
        </span>
      ),
    },
    {
      key: 'approval_type',
      header: isAr ? 'نوع التدقيق' : 'Audit Type',
      render: (item) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-elevated text-content-primary">
          {item.approval_type === 'kyc' ? (
            <>
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>{isAr ? 'هوية الفائز (KYC)' : 'Winner KYC'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
              <span>{isAr ? 'نزاهة السحب' : 'Draw Integrity'}</span>
            </>
          )}
        </span>
      ),
    },
    {
      key: 'subject_id',
      header: isAr ? 'المعرف المستهدف' : 'Subject Target',
      render: (item) => (
        <span className="font-mono text-xs text-content-secondary">
          {item.subject_type}: #{item.subject_id}
        </span>
      ),
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'approved_by',
      header: isAr ? 'المسؤول' : 'Auditor',
      render: (item) => <span className="text-xs text-content-secondary">Admin #{item.approved_by}</span>,
    },
    {
      key: 'created_at',
      header: isAr ? 'تاريخ الإصدار' : 'Issued At',
      render: (item) => (
        <span className="text-xs text-content-secondary">{formatDate(item.created_at, locale)}</span>
      ),
    },
    {
      key: 'actions',
      header: isAr ? 'الإجراءات' : 'Actions',
      render: (item) => {
        if (item.status !== 'valid') {
          return (
            <span className="text-xs text-content-muted">
              {item.revocation_reason ? `سبب: ${item.revocation_reason}` : '—'}
            </span>
          );
        }

        return (
          <button
            onClick={() => setRevokingApproval(item)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors"
            data-testid={`revoke-approval-${item.approval_id}`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{isAr ? 'سحب / إلغاء' : 'Revoke'}</span>
          </button>
        );
      },
    },
  ];

  const renderApprovalMobileCard = (item: AdminApprovalRecord) => {
    return (
      <div className="space-y-3" data-testid={`approval-card-${item.approval_id}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs">
              {item.approval_type === 'kyc' ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-content-primary">{isAr ? 'هوية الفائز (KYC)' : 'Winner KYC'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                  <span className="text-content-primary">{isAr ? 'نزاهة السحب' : 'Draw Integrity'}</span>
                </>
              )}
            </div>
            <span className="font-mono text-xs text-content-secondary block mt-0.5">
              {item.subject_type}: #{item.subject_id}
            </span>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <div className="flex items-center justify-between text-xs text-content-secondary p-2.5 rounded-xl bg-surface-elevated/60 border border-border-subtle">
          <span>Admin #{item.approved_by}</span>
          <span className="text-[11px] text-content-muted">{formatDate(item.created_at, locale)}</span>
        </div>

        {item.status === 'valid' ? (
          <div className="pt-1">
            <button
              onClick={() => setRevokingApproval(item)}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors"
              data-testid={`revoke-approval-${item.approval_id}`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{isAr ? 'سحب / إلغاء القرار' : 'Revoke Decision'}</span>
            </button>
          </div>
        ) : (
          item.revocation_reason && (
            <p className="text-xs text-content-muted italic">
              {isAr ? 'السبب: ' : 'Reason: '}{item.revocation_reason}
            </p>
          )
        )}
      </div>
    );
  };

  return (
    <AdminGuard requiredCapability={['issue_kyc_approval', 'issue_draw_audit_approval']}>
      <div className="space-y-8" data-testid="admin-approvals-page">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-content-primary flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-brand-gold" />
            <span>{isAr ? 'سجل الموافقات والتدقيق الرقابي' : 'Approvals & Verification Registry'}</span>
          </h1>
          <p className="text-sm text-content-secondary mt-1">
            {isAr
              ? 'إصدار وتدقيق وسحب موافقات الهوية ونزاهة السحب اللازمة للإفراج عن جوائز الشركاء.'
              : 'Issue, inspect, or revoke KYC and Draw Integrity approvals required for co-prize releases.'}
          </p>
        </div>

        {/* Issue Approval Form */}
        <ApprovalForm onSuccess={() => refetch()} />

        {/* Filters and Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-content-primary">
              {isAr ? 'سجل القرارات الصادرة' : 'Issued Decisions History'}
            </h2>
            <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-border-subtle text-xs">
              {['all', 'kyc', 'draw_integrity'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors capitalize ${
                    filterType === type
                      ? 'bg-brand-gold text-brand-navy shadow-xs'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  {type === 'all'
                    ? isAr
                      ? 'الكل'
                      : 'All'
                    : type === 'kyc'
                    ? 'KYC'
                    : isAr
                    ? 'نزاهة السحب'
                    : 'Draw Audit'}
                </button>
              ))}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={approvals}
            keyExtractor={(item) => item.approval_id}
            isLoading={isLoading}
            emptyMessage={isAr ? 'لا توجد قرارات موافقة مسجلة.' : 'No approval records found.'}
            mobileRenderer={renderApprovalMobileCard}
          />
        </div>

        {/* Revoke Approval Dialog */}
        <ReasonDialog
          isOpen={!!revokingApproval}
          title={isAr ? 'إلغاء وسحب قرار الموافقة' : 'Revoke Verification Approval'}
          description={
            isAr
              ? `سيتم سحب الموافقة ${revokingApproval?.approval_id} فورياً. إذا كان هناك جائزة شريك معلقة على هذه الموافقة فلن يمكن صرفها حتى يصدر قرار بديل.`
              : `Approval ${revokingApproval?.approval_id} will be immediately revoked. Any co-prize dependent on this approval will be blocked.`
          }
          placeholder={isAr ? 'اكتب سبب الإلغاء بدقة للتدقيق...' : 'Specify revocation justification...'}
          isLoading={isRevoking}
          onConfirm={handleRevoke}
          onClose={() => setRevokingApproval(null)}
        />
      </div>
    </AdminGuard>
  );
}
