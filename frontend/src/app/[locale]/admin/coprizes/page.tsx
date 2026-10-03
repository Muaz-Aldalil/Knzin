'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { useAdminCoPrizes, CoPrizeItem } from '@/hooks/admin/useAdminCoPrizes';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { MoneyText } from '@/components/admin/MoneyText';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { formatDate } from '@/lib/admin/format';
import { Trophy, CheckCircle2, AlertCircle, XCircle, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AdminCoPrizesPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [revokingItem, setRevokingItem] = useState<CoPrizeItem | null>(null);

  const {
    coprizes,
    isLoading,
    releaseCoPrize,
    isReleasing,
    revokeCoPrize,
    isRevoking,
    refetch,
  } = useAdminCoPrizes();

  const handleRelease = async (serial: string) => {
    try {
      await releaseCoPrize(serial);
    } catch (err: any) {
      alert(err?.message || (isAr ? 'فشل صرف الجائزة.' : 'Failed to release co-prize.'));
    }
  };

  const handleConfirmRevoke = async (justification: string) => {
    if (!revokingItem) return;
    try {
      await revokeCoPrize({
        serial: revokingItem.ticket_serial,
        justification,
      });
      setRevokingItem(null);
    } catch (err: any) {
      alert(err?.message || (isAr ? 'فشل إلغاء الجائزة.' : 'Failed to revoke co-prize.'));
    }
  };

  const columns: Column<CoPrizeItem>[] = [
    {
      key: 'ticket_serial',
      header: isAr ? 'تذكرة الفوز' : 'Winning Ticket',
      render: (item) => (
        <div>
          <span className="font-mono text-xs font-bold text-brand-gold block">
            {item.ticket_serial}
          </span>
          <span className="text-xs text-content-secondary">
            {item.user?.email || `User #${item.user_id}`}
          </span>
        </div>
      ),
    },
    {
      key: 'amount_cents',
      header: isAr ? 'قيمة الحصة (40%)' : 'Co-Prize Amount (40%)',
      render: (item) => <MoneyText cents={item.amount_cents} className="text-sm font-bold text-amber-400" />,
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'provenance',
      header: isAr ? 'شروط الصرف (الموافقة المزدوجة)' : 'Dual Approval Provenance',
      render: (item) => {
        const prov = item.approval_provenance;
        if (!prov) {
          return <span className="text-xs text-content-muted">—</span>;
        }

        const isKycValid = prov.kyc.is_approved;
        const isDrawValid = prov.draw_integrity.is_approved;

        return (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isKycValid ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className={isKycValid ? 'text-emerald-400' : 'text-content-secondary'}>
                {isAr ? 'هوية الفائز (KYC): ' : 'Winner KYC: '}
                {prov.kyc.status}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isDrawValid ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className={isDrawValid ? 'text-emerald-400' : 'text-content-secondary'}>
                {isAr ? 'تدقيق السحب: ' : 'Draw Audit: '}
                {prov.draw_integrity.status}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'created_at',
      header: isAr ? 'تاريخ الاستحقاق' : 'Earned At',
      render: (item) => (
        <span className="text-xs text-content-secondary">{formatDate(item.created_at, locale)}</span>
      ),
    },
    {
      key: 'actions',
      header: isAr ? 'الإجراءات' : 'Actions',
      render: (item) => {
        const prov = item.approval_provenance;
        const canRelease = item.status === 'pending' && prov?.is_fully_approved;
        const canRevoke = item.status === 'available';

        if (item.status === 'pending') {
          return (
            <button
              onClick={() => handleRelease(item.ticket_serial)}
              disabled={!canRelease || isReleasing}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                canRelease
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                  : 'bg-surface-elevated text-content-muted border border-border-subtle cursor-not-allowed opacity-50'
              }`}
              data-testid={`release-coprize-${item.ticket_serial}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'صرف للمتاح' : 'Release to Available'}</span>
            </button>
          );
        }

        if (canRevoke) {
          return (
            <button
              onClick={() => setRevokingItem(item)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors"
              data-testid={`revoke-coprize-${item.ticket_serial}`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{isAr ? 'إلغاء واسترداد' : 'Revoke & Clawback'}</span>
            </button>
          );
        }

        return <span className="text-xs text-content-muted">—</span>;
      },
    },
  ];

  return (
    <AdminGuard requiredCapability="adjudicate_affiliate_coprize">
      <div className="space-y-6" data-testid="admin-coprizes-page">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-content-primary flex items-center gap-3">
            <Trophy className="w-7 h-7 text-brand-gold" />
            <span>{isAr ? 'البت في جوائز الشركاء (حصة الـ 40%)' : 'Affiliate Co-Prize Adjudication'}</span>
          </h1>
          <p className="text-sm text-content-secondary mt-1">
            {isAr
              ? 'التحقق المزدوج من هوية الفائز ونزاهة السحب قبل الإفراج عن حصة المسوق، أو استردادها إذا أُلغيت الموافقة.'
              : 'Enforce dual verification (Winner KYC + Draw Integrity) before releasing affiliate co-prizes, with clawback controls.'}
          </p>
        </div>

        {/* Co-Prizes Table */}
        <DataTable
          columns={columns}
          data={coprizes}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage={isAr ? 'لا توجد جوائز شركاء مسجلة.' : 'No co-prize records found.'}
        />

        {/* Revocation Exposure Dialog */}
        {revokingItem && (
          <ReasonDialog
            isOpen={!!revokingItem}
            title={isAr ? 'تأكيد إلغاء جائزة الشريك واسترداد الرصيد' : 'Confirm Co-Prize Revocation & Clawback'}
            description={
              isAr
                ? `سيتم تسجيل قيد خصم عكسي تعويضي (reversal_debit) بقيمة ${(revokingItem.amount_cents / 100).toFixed(2)}$ لحساب المسوق ${revokingItem.user?.email}. تبرير الإلغاء إلزامي للرقابة والتدقيق.`
                : `A compensating reversal_debit of $${(revokingItem.amount_cents / 100).toFixed(2)} will be appended to ${revokingItem.user?.email}. Justification is mandatory.`
            }
            placeholder={isAr ? 'اكتب سبب إلغاء الجائزة بالتفصيل...' : 'Provide revocation justification...'}
            isLoading={isRevoking}
            onConfirm={handleConfirmRevoke}
            onClose={() => setRevokingItem(null)}
          />
        )}
      </div>
    </AdminGuard>
  );
}
