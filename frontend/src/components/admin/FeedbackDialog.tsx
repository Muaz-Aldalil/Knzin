'use client';

import React, { useEffect } from 'react';
import { useLocale } from 'next-intl';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from 'lucide-react';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

export interface FeedbackDialogProps {
  isOpen: boolean;
  type: FeedbackType;
  title?: string;
  message: string;
  confirmText?: string;
  onClose: () => void;
}

export function FeedbackDialog({
  isOpen,
  type,
  title,
  message,
  confirmText,
  onClose,
}: FeedbackDialogProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  // Keyboard accessibility: Escape or Enter closes dialog
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultTitles: Record<FeedbackType, { ar: string; en: string }> = {
    success: { ar: 'تمت العملية بنجاح', en: 'Success' },
    error: { ar: 'تعذر إتمام العملية', en: 'Action Failed' },
    warning: { ar: 'تنبيه هام', en: 'Notice' },
    info: { ar: 'معلومات', en: 'Information' },
  };

  const dialogTitle = title || (isAr ? defaultTitles[type].ar : defaultTitles[type].en);

  const config = {
    success: {
      icon: CheckCircle2,
      iconWrapper: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10',
      button: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/30',
    },
    error: {
      icon: XCircle,
      iconWrapper: 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-500/10',
      button: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/30',
    },
    warning: {
      icon: AlertTriangle,
      iconWrapper: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/10',
      button: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-950/30',
    },
    info: {
      icon: Info,
      iconWrapper: 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/10',
      button: 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/30',
    },
  }[type];

  const IconComponent = config.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border-subtle rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative"
      >
        {/* Close Button Top Corner */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-xl text-content-muted hover:text-content-primary hover:bg-surface-elevated transition-colors cursor-pointer"
          aria-label={isAr ? 'إغلاق' : 'Close'}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Body with Glowing Icon */}
        <div className="flex items-start gap-4 pt-1">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${config.iconWrapper}`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 pe-4">
            <h3 className="text-base font-bold text-content-primary tracking-tight">
              {dialogTitle}
            </h3>
            <p className="text-xs sm:text-sm text-content-secondary mt-1.5 leading-relaxed break-words">
              {message}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end pt-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${config.button}`}
          >
            {confirmText || (isAr ? 'حسناً، فهمت' : 'OK')}
          </button>
        </div>
      </div>
    </div>
  );
}
