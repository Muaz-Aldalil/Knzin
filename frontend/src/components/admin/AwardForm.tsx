'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { useAdminAwards } from '@/hooks/admin/useAdminAwards';
import { Gift, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AwardFormProps {
  onSuccess?: () => void;
}

export function AwardForm({ onSuccess }: AwardFormProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [recipientUserId, setRecipientUserId] = useState('');
  const [drawId, setDrawId] = useState('');
  const [awardTitle, setAwardTitle] = useState('');
  const [awardDetails, setAwardDetails] = useState('');
  const [valuationUsd, setValuationUsd] = useState<number>(0);
  const [reason, setReason] = useState('');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { grantAward, isGranting } = useAdminAwards();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!reason.trim()) {
      setErrorMessage(isAr ? 'سبب المنح الترويجي إلزامي للرقابة.' : 'Reason is mandatory for audit.');
      return;
    }

    try {
      await grantAward({
        recipient_user_id: recipientUserId.trim(),
        draw_id: drawId.trim() || undefined,
        award_title: awardTitle.trim(),
        award_details: awardDetails.trim() || undefined,
        valuation_usd_cents: valuationUsd > 0 ? Math.round(valuationUsd * 100) : undefined,
        reason: reason.trim(),
      });

      setRecipientUserId('');
      setDrawId('');
      setAwardTitle('');
      setAwardDetails('');
      setValuationUsd(0);
      setReason('');
      setSuccessMessage(isAr ? 'تم منح المكافأة الترويجية وتوثيقها بنجاح.' : 'Promotional award granted successfully.');
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err?.message || (isAr ? 'فشل منح المكافأة.' : 'Failed to grant award.'));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-card border border-border-subtle rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 max-w-2xl"
      data-testid="admin-award-form"
    >
      <div className="flex items-center gap-3">
        <div className="text-primary flex items-center justify-center">
          <Gift className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-content-primary">
            {isAr ? 'منح مكافأة أو تذاكر ترويجية خاصة' : 'Grant Promotional Award'}
          </h3>
          <p className="text-xs text-content-secondary mt-0.5">
            {isAr
              ? 'منح تقديري إداري يخضع لشرط التبرير الإلزامي ويوثق فورياً في سجل التدقيق.'
              : 'Discretionary administrative grant with mandatory justification and synchronous audit trail.'}
          </p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-content-primary block mb-1">
            {isAr ? 'معرف المستخدم المستلم (User ID):' : 'Recipient User ID:'}
          </label>
          <input
            type="text"
            required
            value={recipientUserId}
            onChange={(e) => setRecipientUserId(e.target.value)}
            placeholder="e.g. 101"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-sm font-mono focus:border-primary focus:outline-hidden"
            data-testid="input-award-recipient"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-content-secondary block mb-1">
            {isAr ? 'معرف السحب المستهدف (اختياري):' : 'Target Draw ID (Optional):'}
          </label>
          <input
            type="text"
            value={drawId}
            onChange={(e) => setDrawId(e.target.value)}
            placeholder="e.g. 5"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-sm font-mono focus:border-primary focus:outline-hidden"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-content-primary block mb-1">
          {isAr ? 'مسمى المكافأة / التذاكر:' : 'Award Title:'}
        </label>
        <input
          type="text"
          required
          maxLength={150}
          value={awardTitle}
          onChange={(e) => setAwardTitle(e.target.value)}
          placeholder={isAr ? 'مثال: حزمة تذاكر تفوق تدريبي' : 'e.g. VIP Learner Bonus Tickets'}
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-sm focus:border-primary focus:outline-hidden"
          data-testid="input-award-title"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-content-secondary block mb-1">
            {isAr ? 'القيمة التقديرية بالدولار ($ USD):' : 'Estimated Value ($ USD):'}
          </label>
          <input
            type="number"
            min="0"
            value={valuationUsd}
            onChange={(e) => setValuationUsd(parseFloat(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary font-mono text-sm focus:border-primary focus:outline-hidden"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-content-secondary block mb-1">
            {isAr ? 'تفاصيل المكافأة الإضافية:' : 'Award Details (Optional):'}
          </label>
          <input
            type="text"
            value={awardDetails}
            onChange={(e) => setAwardDetails(e.target.value)}
            placeholder={isAr ? 'مثال: 5 تذاكر ترويجية إضافية' : 'e.g. 5 Extra Promo Tickets'}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-sm focus:border-primary focus:outline-hidden"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-content-primary block mb-1">
          {isAr ? 'سبب المنح والتبرير (إلزامي للرقابة والتدقيق):' : 'Award Reason / Justification (Mandatory):'}
        </label>
        <textarea
          rows={3}
          required
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={isAr ? 'اكتب سبب المنح بدقة وتفصيل...' : 'Provide clear justification for this award...'}
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-sm focus:border-primary focus:outline-hidden resize-none"
          data-testid="input-award-reason"
        />
      </div>

      <div className="flex justify-end pt-2 border-t border-border-subtle">
        <button
          type="submit"
          disabled={isGranting || !recipientUserId || !awardTitle || !reason.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-xs transition-colors disabled:opacity-40"
          data-testid="submit-award-button"
        >
          {isGranting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isAr ? 'تأكيد منح المكافأة' : 'Confirm Award Grant'}</span>
        </button>
      </div>
    </form>
  );
}
