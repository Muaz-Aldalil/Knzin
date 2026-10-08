'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { useAdminPayouts } from '@/hooks/admin/useAdminPayouts';
import { PayoutRecord } from '@/types/admin';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { MoneyText } from '@/components/admin/MoneyText';
import { PayoutSettleDialog } from '@/components/admin/PayoutSettleDialog';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { formatDate } from '@/lib/admin/format';
import { BadgeDollarSign, CheckCircle2, XCircle, ShieldCheck, Filter } from 'lucide-react';

export default function AdminPayoutsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [statusFilter, setStatusFilter] = useState('all');
  const [settlingPayout, setSettlingPayout] = useState<PayoutRecord | null>(null);
  const [rejectingPayout, setRejectingPayout] = useState<PayoutRecord | null>(null);

  const {
    payouts,
    isLoading,
    settlePayout,
    isSettling,
    rejectPayout,
    isRejecting,
    refetch,
  } = useAdminPayouts(statusFilter);

  const handleSettle = async (referenceNumber: string, receiptFile: File, notes?: string) => {
    if (!settlingPayout) return;
    await settlePayout({
      payoutNumber: settlingPayout.payout_number,
      referenceNumber,
      receiptFile,
      notes,
    });
  };

  const handleReject = async (reason: string) => {
    if (!rejectingPayout) return;
    await rejectPayout({
      payoutNumber: rejectingPayout.payout_number,
      reason,
    });
    setRejectingPayout(null);
  };

  const columns: Column<PayoutRecord>[] = [
    {
      key: 'payout_number',
      header: isAr ? 'رقم الطلب' : 'Payout #',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-content-primary">
          {item.payout_number}
        </span>
      ),
    },
    {
      key: 'amount_cents',
      header: isAr ? 'المبلغ' : 'Amount',
      render: (item) => <MoneyText cents={item.amount_cents} className="text-sm font-bold" />,
    },
    {
      key: 'payout_method',
      header: isAr ? 'طريقة الاستلام' : 'Method',
      render: (item) => (
        <span className="text-xs font-medium text-content-secondary capitalize">
          {item.payout_method}
        </span>
      ),
    },
    {
      key: 'recipient_details',
      header: isAr ? 'بيانات المستلم' : 'Recipient',
      render: (item) => (
        <div className="text-xs">
          {item.recipient_details ? (
            <>
              <span className="font-bold text-content-primary block">
                {item.recipient_details.account_name || item.recipient_details.recipient_name || '—'}
              </span>
              <span className="font-mono text-content-secondary">
                {item.recipient_details.account_number || item.recipient_details.phone || '—'}
              </span>
            </>
          ) : (
            <span className="text-content-muted">
              {isAr ? 'محجوبة (تتطلب صلاحية تسوية)' : 'Masked (Requires settle permission)'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'requested_at',
      header: isAr ? 'تاريخ الطلب' : 'Requested At',
      render: (item) => (
        <span className="text-xs text-content-secondary">
          {formatDate(item.requested_at, locale)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: isAr ? 'الإجراءات' : 'Actions',
      render: (item) => {
        const isActionable = item.status === 'requested' || item.status === 'processing';
        if (!isActionable) {
          return (
            <span className="text-xs text-content-muted">
              {item.status === 'completed'
                ? isAr
                  ? `مرجع: ${item.mtcn_reference || 'مكتمل'}`
                  : `Ref: ${item.mtcn_reference || 'Done'}`
                : item.rejection_reason || (isAr ? 'مرفوض' : 'Rejected')}
            </span>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettlingPayout(item)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-colors"
              data-testid={`settle-payout-${item.payout_number}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'تسوية' : 'Settle'}</span>
            </button>
            <button
              onClick={() => setRejectingPayout(item)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors"
              data-testid={`reject-payout-${item.payout_number}`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{isAr ? 'رفض' : 'Reject'}</span>
            </button>
          </div>
        );
      },
    },
  ];

  const renderPayoutMobileCard = (item: PayoutRecord) => {
    const isActionable = item.status === 'requested' || item.status === 'processing';

    return (
      <div className="space-y-3" data-testid={`payout-card-${item.payout_number}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-mono text-xs font-bold text-content-primary block">
              {item.payout_number}
            </span>
            <span className="text-[11px] text-content-muted">
              {formatDate(item.requested_at, locale)}
            </span>
          </div>
          <div className="text-end">
            <MoneyText cents={item.amount_cents} className="text-base font-bold text-content-primary block" />
            <StatusBadge status={item.status} />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-elevated/60 border border-border-subtle text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-content-muted">{isAr ? 'طريقة الاستلام:' : 'Method:'}</span>
            <span className="font-medium text-content-secondary capitalize">{item.payout_method}</span>
          </div>
          {item.recipient_details ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-content-muted">{isAr ? 'المستلم:' : 'Recipient:'}</span>
              <span className="font-bold text-content-primary truncate max-w-[200px]">
                {item.recipient_details.account_name || item.recipient_details.recipient_name || item.recipient_details.phone || '—'}
              </span>
            </div>
          ) : (
            <span className="text-content-muted text-[11px] block">
              {isAr ? 'البيانات محجوبة' : 'Masked'}
            </span>
          )}
        </div>

        {isActionable ? (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setSettlingPayout(item)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-colors"
              data-testid={`settle-payout-${item.payout_number}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'تسوية الطلب' : 'Settle'}</span>
            </button>
            <button
              onClick={() => setRejectingPayout(item)}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors shrink-0"
              data-testid={`reject-payout-${item.payout_number}`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{isAr ? 'رفض' : 'Reject'}</span>
            </button>
          </div>
        ) : (
          <div className="text-xs text-content-muted pt-1">
            {item.status === 'completed'
              ? isAr
                ? `مرجع الحوالة: ${item.mtcn_reference || 'مكتمل'}`
                : `Reference: ${item.mtcn_reference || 'Completed'}`
              : item.rejection_reason || (isAr ? 'مرفوض' : 'Rejected')}
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminGuard requiredCapability="settle_affiliate_payout">
      <div className="space-y-6" data-testid="admin-payouts-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary flex items-center gap-3">
              <BadgeDollarSign className="w-7 h-7 text-primary" />
              <span>{isAr ? 'تسوية طلبات سحب الأرباح' : 'Affiliate Payout Settlements'}</span>
            </h1>
            <p className="text-sm text-content-secondary mt-1">
              {isAr
                ? 'تنفيذ الحوالات المالية وإرفاق وصولات الدفع، أو رفض الطلب مع استرجاع الرصيد تلقائياً.'
                : 'Process affiliate withdrawal settlements with receipts or reject with automatic balance restoration.'}
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-border-subtle text-xs max-w-full overflow-x-auto scrollbar-none self-start sm:self-auto">
            {[
              { id: 'all', ar: 'الكل', en: 'All' },
              { id: 'requested', ar: 'جديدة (مطلوبة)', en: 'Requested' },
              { id: 'processing', ar: 'قيد التنفيذ', en: 'Processing' },
              { id: 'completed', ar: 'مكتملة', en: 'Completed' },
              { id: 'rejected', ar: 'مرفوضة', en: 'Rejected' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                {isAr ? tab.ar : tab.en}
              </button>
            ))}
          </div>
        </div>

        {/* Payouts DataTable */}
        <DataTable
          columns={columns}
          data={payouts}
          keyExtractor={(item) => item.payout_number}
          isLoading={isLoading}
          emptyMessage={isAr ? 'لا توجد طلبات سحب مطابقة.' : 'No payout requests found.'}
          mobileRenderer={renderPayoutMobileCard}
        />

        {/* Settlement Dialog */}
        <PayoutSettleDialog
          payout={settlingPayout}
          isOpen={!!settlingPayout}
          isLoading={isSettling}
          onSettle={handleSettle}
          onClose={() => setSettlingPayout(null)}
        />

        {/* Rejection Dialog */}
        <ReasonDialog
          isOpen={!!rejectingPayout}
          title={isAr ? 'رفض طلب السحب' : 'Reject Payout Request'}
          description={
            isAr
              ? `سيتم رفض الطلب ${rejectingPayout?.payout_number} وإعادة الرصيد (${(rejectingPayout?.amount_cents ?? 0) / 100}$) إلى محفظة المسوق عبر قيد عكسي تعويضي (reversal_credit).`
              : `Reject payout ${rejectingPayout?.payout_number} and restore ${(rejectingPayout?.amount_cents ?? 0) / 100}$ to affiliate balance via compensating reversal_credit.`
          }
          placeholder={isAr ? 'اكتب سبب الرفض بالتفصيل (مثل: خطأ في رقم الحساب)...' : 'Provide rejection reason...'}
          isLoading={isRejecting}
          onConfirm={handleReject}
          onClose={() => setRejectingPayout(null)}
        />
      </div>
    </AdminGuard>
  );
}
