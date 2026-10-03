'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { AlertCircle, Loader2 } from 'lucide-react';

interface ReasonDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  maxLength?: number;
  isLoading?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export function ReasonDialog({
  isOpen,
  title,
  description,
  placeholder,
  confirmText,
  cancelText,
  maxLength = 500,
  isLoading = false,
  onConfirm,
  onClose,
}: ReasonDialogProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const isValid = reason.trim().length >= 3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-surface-card border border-border-subtle rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-content-primary">{title}</h3>
            <p className="text-sm text-content-secondary mt-1">{description}</p>
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-semibold text-content-secondary block">
            {isAr ? 'سبب الإجراء (إلزامي للرقابة والتدقيق):' : 'Action Reason (Mandatory for audit):'}
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={maxLength}
            placeholder={
              placeholder ||
              (isAr ? 'اكتب سبب الرفض أو الإلغاء بالتفصيل...' : 'Provide detailed justification...')
            }
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-sm focus:outline-hidden focus:border-brand-gold resize-none"
          />
          <div className="flex justify-end text-xs text-content-muted">
            {reason.length} / {maxLength}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-border-subtle text-content-secondary hover:text-content-primary hover:bg-surface-elevated text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {cancelText || (isAr ? 'إلغاء' : 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmText || (isAr ? 'تأكيد الرفض' : 'Confirm Rejection')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
