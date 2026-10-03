'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmWord?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText,
  cancelText,
  confirmWord,
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [typedInput, setTypedInput] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmWord ? typedInput.trim() === confirmWord : true;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-card border border-border-subtle rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-content-primary">{title}</h3>
            <p className="text-sm text-content-secondary mt-1">{description}</p>
          </div>
        </div>

        {confirmWord && (
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-content-secondary block">
              {isAr
                ? `يرجى كتابة كلمة "${confirmWord}" للتأكيد:`
                : `Please type "${confirmWord}" to confirm:`}
            </label>
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={confirmWord}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-sm focus:outline-hidden focus:border-brand-gold"
            />
          </div>
        )}

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
            type="button"
            onClick={onConfirm}
            disabled={!isConfirmed || isLoading}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold shadow-xs transition-colors disabled:opacity-40 disabled:pointer-events-none ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-brand-gold hover:bg-brand-gold-light text-brand-navy'
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmText || (isAr ? 'تأكيد' : 'Confirm')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
