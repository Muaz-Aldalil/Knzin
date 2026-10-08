'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminSettingsData, useAdminSettings } from '@/hooks/admin/useAdminSettings';
import { ConfirmDialog } from './ConfirmDialog';
import { formatUsd, formatDate } from '@/lib/admin/format';
import { ShieldCheck, Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface SettingsFormProps {
  settings: AdminSettingsData;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { updateSettings, isUpdating } = useAdminSettings();

  const [ratePercent, setRatePercent] = useState<number>(settings.commission_rate_percent);
  const [minPayoutDollars, setMinPayoutDollars] = useState<number>(settings.payout_min_cents / 100);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setRatePercent(settings.commission_rate_percent);
    setMinPayoutDollars(settings.payout_min_cents / 100);
  }, [settings]);

  const hasChanges =
    Math.round(ratePercent * 100) !== settings.commission_rate_bps ||
    Math.round(minPayoutDollars * 100) !== settings.payout_min_cents;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsConfirmOpen(true);
  };

  const handleConfirmUpdate = async () => {
    try {
      const bps = Math.round(ratePercent * 100);
      const cents = Math.round(minPayoutDollars * 100);

      await updateSettings({
        commission_rate_bps: bps,
        payout_min_cents: cents,
      });

      setIsConfirmOpen(false);
      setSuccessMessage(
        isAr ? 'تم حفظ وتفعيل إعدادات المنصة بنجاح.' : 'Platform settings updated successfully.'
      );
    } catch (err: any) {
      setIsConfirmOpen(false);
      setErrorMessage(err?.message || (isAr ? 'فشل حفظ الإعدادات.' : 'Failed to update settings.'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl" data-testid="admin-settings-form">
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Dynamic Settings Card */}
      <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-xs space-y-6">
        <h3 className="text-lg font-bold text-content-primary flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-gold" />
          <span>{isAr ? 'الإعدادات المالية الفعالة' : 'Active Financial Parameters'}</span>
        </h3>

        {/* Commission Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-content-primary">
              {isAr ? 'نسبة عمولة المبيعات الفورية (%):' : 'Direct Sales Commission Rate (%):'}
            </label>
            <span className="text-xs font-mono font-bold text-brand-gold">
              {Math.round(ratePercent * 100)} bps
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={ratePercent}
              onChange={(e) => setRatePercent(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary font-mono focus:border-brand-gold focus:outline-hidden"
              data-testid="input-commission-rate"
            />
            <span className="text-sm font-bold text-content-secondary">%</span>
          </div>
          <p className="text-xs text-content-secondary">
            {isAr
              ? 'تؤثر فقط على المبيعات الجديدة للأمام، ويتم تثبيت النسبة في سجل الإحالة لحظة الشراء دون المساس بالمعاملات القديمة.'
              : 'Applies forward-only to future conversions. Snapshot is frozen at attribution time.'}
          </p>
          {settings.meta['affiliate.commission_rate_bps']?.updated_at && (
            <p className="text-xs text-content-muted">
              {isAr ? 'آخر تحديث: ' : 'Last updated: '}
              {formatDate(settings.meta['affiliate.commission_rate_bps'].updated_at, locale)}
            </p>
          )}
        </div>

        {/* Minimum Payout */}
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-content-primary">
              {isAr ? 'الحد الأدنى لطلب السحب ($ USD):' : 'Minimum Payout Threshold ($ USD):'}
            </label>
            <span className="text-xs font-mono text-content-secondary">
              {Math.round(minPayoutDollars * 100)} {isAr ? 'سنت' : 'cents'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              step="1"
              min="0"
              value={minPayoutDollars}
              onChange={(e) => setMinPayoutDollars(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary font-mono focus:border-brand-gold focus:outline-hidden"
              data-testid="input-payout-min"
            />
            <span className="text-sm font-bold text-content-secondary">$</span>
          </div>
          <p className="text-xs text-content-secondary">
            {isAr
              ? 'أدنى رصيد متاح يسمح للمسوق بتقديم طلب سحب أرباح بناءً عليه.'
              : 'Minimum available balance required for an affiliate to submit a payout request.'}
          </p>
        </div>
      </div>

      {/* Read-Only Invariants Card */}
      <div className="p-6 rounded-2xl bg-surface-elevated/40 border border-border-subtle shadow-xs space-y-4">
        <h4 className="text-sm font-bold text-content-primary flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-gold" />
          <span>{isAr ? 'ثوابت المنظومة المحمية (للقراءة فقط)' : 'Protected System Invariants (Read-Only)'}</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-surface-card border border-border-subtle">
            <span className="text-xs text-content-secondary block mb-1">
              {isAr ? 'فترة استحقاق الأرباح (Maturation Hold)' : 'Commission Maturation Period'}
            </span>
            <span className="text-lg font-bold text-content-primary font-mono">
              {settings.maturation_hours} {isAr ? 'ساعة (24h مجمدة)' : 'Hours (Frozen)'}
            </span>
            <p className="text-xs text-content-muted mt-1">
              {isAr ? 'محددة بالنظام لحماية عمليات الشراء ولا تعدل عبر الواجهة.' : 'Hardened contract invariant.'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-card border border-border-subtle">
            <span className="text-xs text-content-secondary block mb-1">
              {isAr ? 'حصة الشريك في الجائزة الكبرى (Co-Prize)' : 'Grand Prize Co-Share Pool'}
            </span>
            <span className="text-lg font-bold text-content-primary font-mono">
              {settings.co_prize_rate_bps / 100}%
            </span>
            <p className="text-xs text-content-muted mt-1">
              {isAr ? 'حصة ثابتة تخضع للموافقة المزدوجة (هوية + تدقيق نزاهة).' : 'Dual-approval gated pool.'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={!hasChanges || isUpdating}
          data-testid="save-settings-button"
          className="px-6 py-3 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-brand-navy font-bold text-sm shadow-xs transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          {isAr ? 'حفظ وتأكيد التغييرات' : 'Save & Confirm Changes'}
        </button>
      </div>

      {/* Typed Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={isAr ? 'تأكيد تعديل إعدادات المنصة' : 'Confirm Platform Settings Update'}
        description={
          isAr
            ? `أنت على وشك تعديل نسبة العمولة إلى ${ratePercent}% والحد الأدنى للسحب إلى $${minPayoutDollars}. سيتم تسجيل هذا الإجراء بسجل التدقيق الأمني الموحد.`
            : `You are updating the commission rate to ${ratePercent}% and min payout to $${minPayoutDollars}. This action will be synchronously audited.`
        }
        confirmWord="CONFIRM"
        isLoading={isUpdating}
        onConfirm={handleConfirmUpdate}
        onClose={() => setIsConfirmOpen(false)}
      />
    </form>
  );
}
