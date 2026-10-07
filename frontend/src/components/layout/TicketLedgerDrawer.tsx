'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Copy,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  LogIn,
} from 'lucide-react';
import { useLearnerTickets, TicketItem, ActiveDrawMeta } from '@/hooks/useLearnerTickets';

interface TicketLedgerDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function TicketLedgerDrawer({ isOpen: controlledIsOpen, onClose }: TicketLedgerDrawerProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  // Support opening via custom event `knzin:open-tickets-drawer`
  useEffect(() => {
    const handleOpenEvent = () => {
      setInternalIsOpen(true);
    };

    window.addEventListener('knzin:open-tickets-drawer', handleOpenEvent);
    return () => {
      window.removeEventListener('knzin:open-tickets-drawer', handleOpenEvent);
    };
  }, []);

  const {
    totalTickets,
    activeDraws,
    tickets,
    isEmpty,
    isLoading,
    isError,
    isUnauthenticated,
    getTimeRemainingMs,
    refetch,
  } = useLearnerTickets();

  // Re-fetch when drawer opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const handleCopySerial = (serial: string) => {
    navigator.clipboard.writeText(serial);
    setCopiedSerial(serial);
    setTimeout(() => {
      setCopiedSerial(null);
    }, 2000);
  };

  const formatCountdown = (ms: number): string => {
    if (ms <= 0) return isRtl ? 'مغلق' : 'Closed';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return isRtl ? `${days} يوم` : `${days}d`;
    }

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (!open ? handleClose() : null)}>
      <SheetContent
        side={isRtl ? 'right' : 'left'}
        className="w-full sm:max-w-md p-0 flex flex-col justify-between bg-surface border-border-subtle"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-border-subtle">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
              <div className="text-start">
                <SheetTitle className="text-lg font-bold text-content-primary">
                  {isRtl ? 'دفتر التذاكر الترويجية' : 'Promotional Ticket Ledger'}
                </SheetTitle>
                <SheetDescription className="text-xs text-content-muted">
                  {isRtl
                    ? 'تذاكر سحب مجانية تمنح مع كل مادة تعليمية يتم شراؤها'
                    : 'Free promotional tickets granted with each purchased course'}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Total Badge Strip */}
          <div className="mt-4 p-3 rounded-xl bg-surface-secondary flex items-center justify-between">
            <span className="text-xs font-semibold text-content-secondary">
              {isRtl ? 'إجمالي التذاكر المصدرة' : 'Total Issued Tickets'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-600 dark:text-amber-400">
              <Ticket className="w-3.5 h-3.5" />
              <span>{totalTickets} {isRtl ? 'تذكرة' : 'Tickets'}</span>
            </span>
          </div>

          {/* Active Draws Countdown Bar */}
          {activeDraws && Object.keys(activeDraws).length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
              {/* Hourly */}
              {activeDraws.hourly && (
                <div className="p-2 rounded-lg bg-surface-primary border border-border-subtle">
                  <span className="text-content-muted block font-medium">
                    {isRtl ? 'الساعي' : 'Hourly'}
                  </span>
                  <span className="font-mono font-bold text-content-primary block mt-0.5">
                    {formatCountdown(getTimeRemainingMs(activeDraws.hourly.ends_at))}
                  </span>
                </div>
              )}
              {/* Daily */}
              {activeDraws.daily && (
                <div className="p-2 rounded-lg bg-surface-primary border border-border-subtle">
                  <span className="text-content-muted block font-medium">
                    {isRtl ? 'اليومي' : 'Daily'}
                  </span>
                  <span className="font-mono font-bold text-content-primary block mt-0.5">
                    {formatCountdown(getTimeRemainingMs(activeDraws.daily.ends_at))}
                  </span>
                </div>
              )}
              {/* Monthly */}
              {activeDraws.monthly && (
                <div className="p-2 rounded-lg bg-surface-primary border border-border-subtle">
                  <span className="text-content-muted block font-medium">
                    {isRtl ? 'الشهري' : 'Monthly'}
                  </span>
                  <span className="font-mono font-bold text-content-primary block mt-0.5">
                    {formatCountdown(getTimeRemainingMs(activeDraws.monthly.ends_at))}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Body — Ticket List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isUnauthenticated ? (
            /* Unauthenticated Guest State */
            <div className="p-8 rounded-2xl bg-surface-secondary/50 border border-dashed border-border-subtle text-center space-y-4 animate-in fade-in-50 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto shadow-inner">
                <Ticket className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-extrabold text-content-primary">
                  {isRtl ? 'سجّل دخولك للاطلاع على تذاكر السحب' : 'Sign In to View Your Raffle Tickets'}
                </h4>
                <p className="text-xs text-content-muted leading-relaxed max-w-xs mx-auto">
                  {isRtl
                    ? 'احصل على تذاكر سحب مجانية عند شراء أي جزء تدريبي مهني ($2) أو 15 تذكرة كاملة عند شراء الحقيبة الشاملة ($10). سجّل دخولك لعرض تذاكرك ومتابعة السحوبات.'
                    : 'Earn complimentary promotional raffle tickets with every vocational course part ($2) or bundle ($10). Sign in to see your tickets and live draws.'}
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/auth/login?redirect=/tickets"
                  onClick={handleClose}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
                </Link>
                <Link
                  href="/"
                  onClick={handleClose}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border-subtle text-content-primary text-xs font-semibold hover:bg-surface-secondary transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>{isRtl ? 'تصفح الدورات المهنية' : 'Explore Courses'}</span>
                </Link>
              </div>
            </div>
          ) : isLoading ? (
            <div className="min-h-[200px] flex flex-col items-center justify-center text-slate-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">{isRtl ? 'جاري جلب التذاكر...' : 'Loading tickets...'}</span>
            </div>
          ) : isError ? (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-500/20 text-center">
              <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="text-xs text-red-700 dark:text-red-300">
                {isRtl ? 'تعذر جلب التذاكر. يرجى المحاولة لاحقاً.' : 'Failed to load tickets. Please try again.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 text-xs font-bold text-primary hover:underline"
              >
                {isRtl ? 'إعادة المحاولة' : 'Retry'}
              </button>
            </div>
          ) : isEmpty ? (
            /* Empty State */
            <div className="p-8 rounded-2xl bg-surface-secondary/50 border border-dashed border-border-subtle text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
                <Ticket className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-content-primary">
                {isRtl ? 'لا توجد لديك تذاكر سحب بعد' : 'No Raffle Tickets Yet'}
              </h4>
              <p className="text-xs text-content-muted leading-relaxed">
                {isRtl
                  ? 'احصل على تذكرة سحب مجانية عند شراء أي جزء تدريبي بـ 2$، أو 15 تذكرة كاملة عند شراء الحقيبة الشاملة بـ 10$.'
                  : 'Get 1 free raffle ticket with each $2 course part, or 15 tickets with a $10 complete bundle.'}
              </p>
              <Link
                href="/"
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تصفح الدورات واكسب تذاكر' : 'Explore Courses & Earn Tickets'}</span>
              </Link>
            </div>
          ) : (
            /* Ticket Cards */
            tickets.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-xl bg-surface border border-border-subtle shadow-2xs space-y-3 transition-colors hover:border-border"
              >
                {/* Serial Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-content-primary tracking-wider">
                      {t.serial_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopySerial(t.serial_number)}
                      className="p-1 rounded hover:bg-surface-secondary text-content-muted hover:text-content-primary transition-colors"
                      title={isRtl ? 'نسخ الرقم التسلسلي' : 'Copy Serial Number'}
                      aria-label={isRtl ? 'نسخ الرقم التسلسلي' : 'Copy Serial Number'}
                    >
                      {copiedSerial === t.serial_number ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <span className="text-[10px] text-content-muted">
                    {new Date(t.issued_at).toLocaleDateString(locale, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Originating Order */}
                {t.originating_order_number && (
                  <div className="text-[11px] text-content-muted">
                    <span>{isRtl ? 'طلب الشراء: ' : 'Order: '}</span>
                    <span className="font-mono text-content-secondary">{t.originating_order_number}</span>
                  </div>
                )}

                {/* Eligibility Badges */}
                <div className="pt-2 border-t border-border-subtle flex flex-wrap gap-1.5">
                  {/* Hourly */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.eligibility.hourly.is_eligible
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : t.eligibility.hourly.status === 'locked'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-surface-secondary text-content-muted'
                    }`}
                  >
                    {t.eligibility.hourly.is_eligible ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : t.eligibility.hourly.status === 'locked' ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    <span>{isRtl ? 'الساعي' : 'Hourly'}</span>
                  </span>

                  {/* Daily */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.eligibility.daily.is_eligible
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : t.eligibility.daily.status === 'locked'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-surface-secondary text-content-muted'
                    }`}
                  >
                    {t.eligibility.daily.is_eligible ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : t.eligibility.daily.status === 'locked' ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    <span>{isRtl ? 'اليومي' : 'Daily'}</span>
                  </span>

                  {/* Monthly */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.eligibility.monthly.is_eligible
                        ? 'bg-primary/10 text-primary'
                        : t.eligibility.monthly.status === 'locked'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-surface-secondary text-content-muted'
                    }`}
                  >
                    {t.eligibility.monthly.is_eligible ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : t.eligibility.monthly.status === 'locked' ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    <span>{isRtl ? 'الشهري الكبير' : 'Monthly Grand'}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface-secondary/40 text-center">
          <Link
            href="/raffle"
            onClick={handleClose}
            className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isRtl ? 'تعرف على نظام الشفافية القانوني للسحوبات' : 'Learn About Legal Raffle Transparency'}</span>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
