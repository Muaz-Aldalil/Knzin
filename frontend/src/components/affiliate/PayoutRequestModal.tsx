'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { X, Wallet, ShieldAlert, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useAffiliatePayouts, PayoutMethod } from '@/hooks/useAffiliatePayouts';
import { ApiError } from '@/lib/api-client';

interface PayoutRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  unpaidAvailableCents: number;
  minimumPayoutCents: number;
  minimumPayoutFormatted: string;
}

export function PayoutRequestModal({
  isOpen,
  onClose,
  unpaidAvailableCents,
  minimumPayoutCents,
  minimumPayoutFormatted,
}: PayoutRequestModalProps) {
  const t = useTranslations('affiliate');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const { requestPayout, isSubmitting, resetSubmission } = useAffiliatePayouts();

  const isEligible = unpaidAvailableCents >= minimumPayoutCents;
  const maxAvailableDollars = (unpaidAvailableCents / 100).toFixed(2);

  const [amountDollars, setAmountDollars] = useState(maxAvailableDollars);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('zain_cash');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [governorate, setGovernorate] = useState('بغداد');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successPayoutNumber, setSuccessPayoutNumber] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMessage(null);
    setSuccessPayoutNumber(null);
    resetSubmission();
    onClose();
  };

  const handleSetMax = () => {
    setAmountDollars(maxAvailableDollars);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amountFloat = parseFloat(amountDollars);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      setErrorMessage(isRtl ? 'يرجى إدخال مبلغ صالح أكبر من الصفر.' : 'Please enter a valid amount greater than zero.');
      return;
    }

    const amountCents = Math.round(amountFloat * 100);
    if (amountCents > unpaidAvailableCents) {
      setErrorMessage(
        isRtl
          ? 'المبلغ المطلوب يتجاوز رصيدك المتاح حالياً.'
          : 'Requested amount exceeds your currently available balance.'
      );
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage(isRtl ? 'يرجى إدخال الاسم الثلاثي كما هو في البطاقة الوطنية.' : 'Please enter full legal name as on ID.');
      return;
    }

    if ((payoutMethod === 'zain_cash' || payoutMethod === 'asia_hawala') && !phoneNumber.trim()) {
      setErrorMessage(isRtl ? 'يرجى إدخال رقم محفظة الهاتف المسجلة.' : 'Please enter registered wallet phone number.');
      return;
    }

    try {
      const res = await requestPayout({
        amount_cents: amountCents,
        payout_method: payoutMethod,
        recipient_details: {
          phone_number: phoneNumber.trim(),
          account_name: fullName.trim(),
          governorate: governorate.trim(),
        },
      });

      setSuccessPayoutNumber(res.payout_number);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err?.message || (isRtl ? 'حدث خطأ أثناء معالجة الطلب.' : 'An error occurred.'));
      }
    }
  };

  const amountCentsPreview = Math.round((parseFloat(amountDollars) || 0) * 100);
  const iqdEstimate = intdivMath(amountCentsPreview * 1310, 100);

  function intdivMath(a: number, b: number): number {
    return Math.floor(a / b);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-surface border border-border-subtle rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-content-primary">
              {t('payoutModalTitle')}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-content-secondary hover:text-content-primary hover:bg-surface-secondary transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {successPayoutNumber ? (
            <div className="text-center py-6 space-y-4">
              <div className="text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h4 className="text-lg font-bold text-content-primary">
                {isRtl ? 'تم تقديم طلب السحب بنجاح' : 'Payout Request Submitted!'}
              </h4>
              <p className="text-xs text-content-secondary max-w-sm mx-auto">
                {t('payoutSuccess')}
              </p>
              <div className="p-3 bg-surface-secondary rounded-xl font-mono text-sm font-bold text-content-primary">
                {successPayoutNumber}
              </div>
              <button
                onClick={handleClose}
                className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors"
                type="button"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dynamic Threshold Policy Notice */}
              <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle text-xs text-content-secondary">
                <div className="font-semibold text-content-primary mb-0.5">
                  {isRtl ? 'الحد الأدنى المعتمد للسحب' : 'Active Minimum Threshold'}
                </div>
                {t('minimumThresholdNotice', { amount: minimumPayoutFormatted })}
              </div>

              {/* Ineligibility Warning */}
              {!isEligible && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">
                      {isRtl ? 'الرصيد غير مؤهل للسحب حالياً' : 'Balance Ineligible for Withdrawal'}
                    </span>
                    {t('insufficientBalance')}
                    <div className="mt-1 font-semibold">
                      {isRtl ? 'رصيدك المتاح:' : 'Your available:'} ${(unpaidAvailableCents / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                  {errorMessage}
                </div>
              )}

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-content-secondary">
                    {t('amountToWithdraw')}
                  </label>
                  <button
                    type="button"
                    onClick={handleSetMax}
                    className="text-xs text-primary font-bold hover:underline"
                    disabled={!isEligible}
                  >
                    {isRtl ? `الكل ($${maxAvailableDollars})` : `Max ($${maxAvailableDollars})`}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute start-3.5 top-1/2 -translate-y-1/2 text-content-muted font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={maxAvailableDollars}
                    disabled={!isEligible}
                    value={amountDollars}
                    onChange={(e) => setAmountDollars(e.target.value)}
                    className="w-full ps-9 pe-4 py-2.5 rounded-xl bg-surface-secondary border border-border-subtle text-content-primary text-sm font-semibold focus:outline-hidden focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                {amountCentsPreview > 0 && (
                  <div className="mt-1 text-[11px] text-content-secondary">
                    ≈ {iqdEstimate.toLocaleString()} IQD
                  </div>
                )}
              </div>

              {/* Payout Method */}
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                  {t('payoutMethod')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'zain_cash', label: t('payoutMethodZainCash') },
                    { id: 'asia_hawala', label: t('payoutMethodAsiaHawala') },
                    { id: 'western_union', label: t('payoutMethodWesternUnion') },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!isEligible}
                      onClick={() => setPayoutMethod(m.id as PayoutMethod)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        payoutMethod === m.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border-subtle bg-surface-secondary text-content-secondary hover:text-content-primary'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Full Name */}
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                  {t('recipientFullName')}
                </label>
                <input
                  type="text"
                  disabled={!isEligible}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isRtl ? 'مثال: علي فرج حسين' : 'e.g. Ali Faraj Hussein'}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border-subtle text-content-primary text-sm focus:outline-hidden focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Phone / Wallet Number (for ZainCash or AsiaHawala) */}
              {(payoutMethod === 'zain_cash' || payoutMethod === 'asia_hawala') && (
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                    {t('recipientNumber')}
                  </label>
                  <input
                    type="tel"
                    disabled={!isEligible}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="07801234567"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border-subtle text-content-primary text-sm font-mono focus:outline-hidden focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              )}

              {/* Governorate Selection */}
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                  {isRtl ? 'المحافظة' : 'Governorate'}
                </label>
                <select
                  disabled={!isEligible}
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-border-subtle text-content-primary text-sm focus:outline-hidden focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {['بغداد', 'البصرة', 'أربيل', 'النجف', 'كربلاء', 'السليمانية', 'نينوى', 'بابل', 'ذي قار', 'كركوك', 'الأنبار', 'ديالى', 'ميسان', 'واسط', 'المثنى', 'القادسية', 'صلاح الدين', 'دهوك'].map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-border-subtle text-xs font-semibold text-content-secondary hover:bg-surface-secondary transition-colors"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!isEligible || isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{isRtl ? 'جاري الإرسال...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('submitPayout')}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
