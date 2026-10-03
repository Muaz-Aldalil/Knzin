'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { PayoutRecord } from '@/types/admin';
import { MoneyText } from './MoneyText';
import { CheckCircle2, Upload, Loader2, AlertCircle } from 'lucide-react';

interface PayoutSettleDialogProps {
  payout: PayoutRecord | null;
  isOpen: boolean;
  isLoading: boolean;
  onSettle: (referenceNumber: string, receiptFile: File, notes?: string) => Promise<void>;
  onClose: () => void;
}

export function PayoutSettleDialog({
  payout,
  isOpen,
  isLoading,
  onSettle,
  onClose,
}: PayoutSettleDialogProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !payout) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError(isAr ? 'حجم الملف يجب ألا يتجاوز 5 ميغابايت.' : 'File size must not exceed 5MB.');
        return;
      }
      setError(null);
      setReceiptFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) {
      setError(isAr ? 'رقم الحوالة أو المرجع إلزامي.' : 'Reference number is mandatory.');
      return;
    }
    if (!receiptFile) {
      setError(isAr ? 'إرفاق وصل التحويل إلزامي.' : 'Receipt file upload is mandatory.');
      return;
    }

    try {
      setError(null);
      await onSettle(referenceNumber.trim(), receiptFile, notes.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || (isAr ? 'فشلت عملية التسوية.' : 'Settlement failed.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-surface-card border border-border-subtle rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5"
        data-testid="payout-settle-dialog"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-content-primary">
              {isAr ? 'تسوية وإتمام طلب السحب' : 'Settle Affiliate Payout'}
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">
              {isAr ? 'رقم الطلب: ' : 'Payout: '}
              <span className="font-mono font-bold text-brand-gold">{payout.payout_number}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Payout Summary Info */}
        <div className="p-4 rounded-xl bg-surface-elevated/50 border border-border-subtle space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-content-secondary">{isAr ? 'المبلغ المطلوب:' : 'Amount:'}</span>
            <MoneyText cents={payout.amount_cents} className="text-sm font-bold text-emerald-400" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-content-secondary">{isAr ? 'طريقة الاستلام:' : 'Method:'}</span>
            <span className="font-semibold text-content-primary capitalize">{payout.payout_method}</span>
          </div>
          {payout.recipient_details && (
            <div className="pt-2 border-t border-border-subtle space-y-1">
              <span className="font-semibold text-content-primary block">
                {isAr ? 'بيانات المستلم المعتمدة:' : 'Recipient Details:'}
              </span>
              <p className="font-mono text-content-secondary truncate">
                {payout.recipient_details.account_name || payout.recipient_details.recipient_name} •{' '}
                {payout.recipient_details.account_number || payout.recipient_details.phone}
              </p>
            </div>
          )}
        </div>

        {/* Reference Number Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-content-primary block">
            {isAr ? 'رقم مرجع الحوالة / MTCN (إلزامي):' : 'Transaction Reference / MTCN (Mandatory):'}
          </label>
          <input
            type="text"
            required
            maxLength={128}
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder={isAr ? 'مثال: WU-982341098 أو ZC-202610-09' : 'e.g. MTCN-12345678'}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary font-mono text-sm focus:border-brand-gold focus:outline-hidden"
            data-testid="input-settle-reference"
          />
        </div>

        {/* Receipt Upload Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-content-primary block">
            {isAr ? 'وصل التحويل البنكي / صورة الإشعار (إلزامي):' : 'Receipt / Transfer Slip (Mandatory):'}
          </label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border-subtle hover:border-brand-gold cursor-pointer bg-surface-elevated text-xs text-content-secondary hover:text-content-primary transition-colors">
              <Upload className="w-4 h-4 text-brand-gold" />
              <span className="truncate">
                {receiptFile ? receiptFile.name : isAr ? 'اختر صورة الوصل (JPG, PNG, WebP)' : 'Choose receipt file'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
                data-testid="input-settle-receipt"
              />
            </label>
          </div>
          <p className="text-[11px] text-content-muted">
            {isAr
              ? 'يتم تخزين الوصل في قرص سحابي خاص ومحمي تماماً، ويتم حساب بصمة SHA-256 للمطابقة.'
              : 'Stored in isolated private disk with cryptographic SHA-256 checksum.'}
          </p>
        </div>

        {/* Optional Notes */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-content-secondary block">
            {isAr ? 'ملاحظات إدارية إضافية (اختياري):' : 'Internal Notes (Optional):'}
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isAr ? 'ملاحظات داخلية للفريق...' : 'Internal reference note...'}
            className="w-full px-3.5 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-xs focus:border-brand-gold focus:outline-hidden"
          />
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-border-subtle text-content-secondary hover:text-content-primary hover:bg-surface-elevated text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={!referenceNumber.trim() || !receiptFile || isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xs transition-colors disabled:opacity-40 disabled:pointer-events-none"
            data-testid="confirm-settle-button"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isAr ? 'تأكيد التسوية والتحويل' : 'Confirm Settlement'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
