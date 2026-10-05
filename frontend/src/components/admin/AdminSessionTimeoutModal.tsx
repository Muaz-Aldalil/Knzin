'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Clock, ShieldAlert, Loader2, LogOut, RefreshCw } from 'lucide-react';

interface AdminSessionTimeoutModalProps {
  isOpen: boolean;
  remainingSeconds: number | null;
  onExtend: () => Promise<void>;
  onSignOut: () => void;
  isExtending?: boolean;
}

export function AdminSessionTimeoutModal({
  isOpen,
  remainingSeconds,
  onExtend,
  onSignOut,
  isExtending = false,
}: AdminSessionTimeoutModalProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const seconds = Math.max(0, remainingSeconds ?? 0);
  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;

  // Percentage of 60-second warning remaining
  const progressPercent = Math.min(100, Math.max(0, (seconds / 60) * 100));

  return (
    <Dialog open={isOpen}>
      <DialogContent
        data-testid="admin-session-timeout-modal"
        className="sm:max-w-md border-amber-500/30 bg-surface/95 backdrop-blur-md shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center space-y-3">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
            <Clock className="w-8 h-8 animate-pulse text-amber-500" />
            <span className="absolute -top-1 -end-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
            </span>
          </div>

          <DialogTitle className="text-xl font-bold text-content-primary">
            {isAr ? 'جلسة الإدارة على وشك الانتهاء خلال دقيقة واحدة' : 'Admin Session Will Expire in 1 Minute'}
          </DialogTitle>

          <DialogDescription className="text-xs text-content-secondary max-w-sm">
            {isAr
              ? 'يرجى تمديد الجلسة لمواصلة العمل دون انقطاع، أو سيتم حفظ مسودتك تلقائياً وتسجيل خروجك بأمان لحماية البيانات.'
              : 'Please extend your session to continue working uninterrupted, or your draft will be saved and you will be signed out safely.'}
          </DialogDescription>
        </DialogHeader>

        {/* Big Countdown Timer */}
        <div className="py-4 my-1 flex flex-col items-center justify-center rounded-2xl bg-surface-elevated/70 border border-border-subtle">
          <span
            data-testid="admin-session-countdown-display"
            className="text-4xl font-extrabold font-mono tracking-wider text-amber-500 tabular-nums"
          >
            {formattedTime}
          </span>
          <span className="text-[11px] font-semibold text-content-muted mt-1 uppercase tracking-wider">
            {isAr ? 'الوقت المتبقي' : 'Time Remaining'}
          </span>

          {/* Shrinking Warning Progress Bar */}
          <div className="w-48 h-1.5 bg-border-subtle rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end mt-2">
          <button
            type="button"
            onClick={onSignOut}
            data-testid="admin-session-signout-btn"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border-subtle text-xs font-semibold text-content-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isAr ? 'تسجيل الخروج الآن' : 'Sign Out Now'}</span>
          </button>

          <button
            type="button"
            onClick={onExtend}
            disabled={isExtending}
            data-testid="admin-session-extend-btn"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-gold to-brand-gold-dark hover:from-brand-gold-light hover:to-brand-gold text-brand-navy text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isExtending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-brand-navy" />
                <span>{isAr ? 'جارِ التمديد...' : 'Extending...'}</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-brand-navy" />
                <span>{isAr ? 'تمديد الجلسة' : 'Extend Session'}</span>
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
