'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { useAdminApprovals } from '@/hooks/admin/useAdminApprovals';
import { useAdminSession } from '@/hooks/admin/useAdminSession';
import { ShieldCheck, UserCheck, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ApprovalFormProps {
  onSuccess?: () => void;
}

export function ApprovalForm({ onSuccess }: ApprovalFormProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { can } = useAdminSession();

  const canKyc = can('issue_kyc_approval');
  const canDrawAudit = can('issue_draw_audit_approval');

  const [activeTab, setActiveTab] = useState<'kyc' | 'draw_integrity'>(
    canKyc ? 'kyc' : 'draw_integrity'
  );

  const [userId, setUserId] = useState('');
  const [drawId, setDrawId] = useState('');
  const [status, setStatus] = useState<'valid' | 'rejected'>('valid');
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { issueKyc, isIssuingKyc, issueDrawIntegrity, isIssuingDrawIntegrity } = useAdminApprovals();
  const isSubmitting = isIssuingKyc || isIssuingDrawIntegrity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (activeTab === 'kyc') {
        const uid = parseInt(userId, 10);
        if (isNaN(uid) || uid <= 0) {
          setErrorMessage(isAr ? 'يرجى إدخال معرف مستخدم صحيح.' : 'Valid User ID required.');
          return;
        }
        await issueKyc({
          subject_user_id: uid,
          status,
          notes: notes.trim() || undefined,
        });
        setUserId('');
        setNotes('');
        setSuccessMessage(isAr ? 'تم تسجيل قرار فحص الهوية (KYC) بنجاح.' : 'KYC approval issued successfully.');
      } else {
        const did = parseInt(drawId, 10);
        if (isNaN(did) || did <= 0) {
          setErrorMessage(isAr ? 'يرجى إدخال معرف سحب صحيح.' : 'Valid Draw ID required.');
          return;
        }
        await issueDrawIntegrity({
          draw_id: did,
          status,
          notes: notes.trim() || undefined,
        });
        setDrawId('');
        setNotes('');
        setSuccessMessage(isAr ? 'تم تسجيل قرار تدقيق نزاهة السحب بنجاح.' : 'Draw integrity approval issued successfully.');
      }
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err?.message || (isAr ? 'فشل إصدار الموافقة.' : 'Failed to issue approval.'));
    }
  };

  return (
    <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-gold" />
          <span>{isAr ? 'إصدار موافقة تدقيق جديدة' : 'Issue New Verification Record'}</span>
        </h3>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-border-subtle text-xs">
          {canKyc && (
            <button
              type="button"
              onClick={() => setActiveTab('kyc')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === 'kyc'
                  ? 'bg-brand-gold text-brand-navy'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'هوية الفائز (KYC)' : 'Winner KYC'}</span>
            </button>
          )}
          {canDrawAudit && (
            <button
              type="button"
              onClick={() => setActiveTab('draw_integrity')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === 'draw_integrity'
                  ? 'bg-brand-gold text-brand-navy'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'نزاهة السحب' : 'Draw Integrity'}</span>
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === 'kyc' ? (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-content-primary block">
              {isAr ? 'معرف المستخدم الفائز (User ID):' : 'Winner Subject User ID:'}
            </label>
            <input
              type="number"
              min="1"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. 42"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-sm font-mono focus:border-brand-gold focus:outline-hidden"
              data-testid="input-kyc-user-id"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-content-primary block">
              {isAr ? 'معرف السحب (Draw ID):' : 'Target Draw ID:'}
            </label>
            <input
              type="number"
              min="1"
              required
              value={drawId}
              onChange={(e) => setDrawId(e.target.value)}
              placeholder="e.g. 5"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-sm font-mono focus:border-brand-gold focus:outline-hidden"
              data-testid="input-draw-audit-id"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-content-primary block">
              {isAr ? 'القرار والنتيجة:' : 'Decision Status:'}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-sm focus:border-brand-gold focus:outline-hidden"
            >
              <option value="valid">{isAr ? 'معتمد ومقبول (Valid / Approved)' : 'Valid / Approved'}</option>
              <option value="rejected">{isAr ? 'مرفوض (Rejected)' : 'Rejected'}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary block">
              {isAr ? 'ملاحظات التدقيق (اختياري):' : 'Audit Notes (Optional):'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isAr ? 'تفاصيل الفحص والتوثيق...' : 'Verification details...'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-sm focus:border-brand-gold focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-brand-navy font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
            data-testid="submit-approval-button"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isAr ? 'تسجيل القرار رسمياً' : 'Record Official Decision'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
