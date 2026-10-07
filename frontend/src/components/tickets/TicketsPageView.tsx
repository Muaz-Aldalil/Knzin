'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Ticket,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ArrowUpRight,
  Gift,
  Search,
} from 'lucide-react';
import { useLearnerTickets, TicketItem } from '@/hooks/useLearnerTickets';

export function TicketsPageView() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

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

  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('knzin_auth_token') : false;

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

  // State 1: Unauthenticated
  if (!hasToken || isUnauthenticated) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 rounded-3xl bg-surface border border-border-subtle text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-content-primary">
          {isRtl ? 'سجّل الدخول لعرض تذاكر السحب الخاصة بك' : 'Sign In to View Your Raffle Tickets'}
        </h2>
        <p className="mt-2 text-sm text-content-secondary max-w-md mx-auto">
          {isRtl
            ? 'تذاكر السحب الترويجية المجانية مرتبطة بحسابك التعليمي. سجّل الدخول لمتابعة أرقام التذاكر وفرص الفوز.'
            : 'Your complimentary promotional sweepstakes tickets are linked to your learning account. Sign in to view your serials.'}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth/login?redirect=/tickets"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-all shadow-xs"
          >
            <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-surface-secondary hover:bg-surface-elevated text-content-secondary text-sm font-semibold transition-colors border border-border-subtle"
          >
            {isRtl ? 'تصفح الدورات' : 'Browse Courses'}
          </Link>
        </div>
      </div>
    );
  }

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.serial_number.toLowerCase().includes(term) ||
      (t.originating_order_number && t.originating_order_number.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex items-center gap-2 text-xs text-content-muted">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  {isRtl ? 'الرئيسية' : 'Home'}
                </Link>
              </li>
              <li>•</li>
              <li className="text-content-primary font-semibold">
                {isRtl ? 'دفتر تذاكر السحب الترويجية' : 'Promotional Ticket Ledger'}
              </li>
            </ol>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight flex items-center gap-3">
            <Ticket className="w-7 h-7 text-accent shrink-0" />
            <span>{isRtl ? 'دفتر تذاكر السحب الترويجية' : 'Promotional Ticket Ledger'}</span>
          </h1>
          <p className="mt-1 text-sm text-content-secondary font-medium">
            {isRtl
              ? 'تذاكر سحب رسمية وموثقة تصدر مجاناً كهدية ترويجية مع كل دورة أو جزء تعليمي تشتريه.'
              : 'Certified complimentary promotional tickets granted with each purchased course or part.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/raffle"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/90 transition-colors shadow-xs"
          >
            <Gift className="w-4 h-4" />
            <span>{isRtl ? 'ساحة السحوبات المباشرة' : 'Live Draws Arena'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-secondary hover:bg-surface-elevated text-content-secondary text-xs font-semibold transition-colors border border-border-subtle"
          >
            {isRtl ? 'لوحة تدريبي' : 'My Hub'}
          </Link>
        </div>
      </div>

      {/* Stat Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-content-muted font-medium block">
              {isRtl ? 'إجمالي التذاكر النشطة' : 'Active Tickets'}
            </span>
            <span className="text-3xl font-black text-content-primary mt-1 block">
              {totalTickets}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{isRtl ? 'مؤهلة لجميع السحوبات' : 'Eligible for all tiers'}</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        {/* Hourly Micro-Draw */}
        <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-content-secondary">
            <span>{isRtl ? 'السحب الساعي السريع' : 'Hourly Micro-Draw'}</span>
            <Clock className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-mono text-2xl font-black text-content-primary mt-2 block">
            {activeDraws?.hourly ? formatCountdown(getTimeRemainingMs(activeDraws.hourly.ends_at)) : (isRtl ? 'نشط' : 'Active')}
          </span>
          <span className="text-[11px] text-content-muted block mt-1">
            {isRtl ? 'جوائز نقدية وشحن فوري' : 'Cash & instant top-ups'}
          </span>
        </div>

        {/* Daily Golden Draw */}
        <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-content-secondary">
            <span>{isRtl ? 'السحب اليومي الذهبي' : 'Daily Golden Draw'}</span>
            <Clock className="w-3.5 h-3.5 text-accent" />
          </div>
          <span className="font-mono text-2xl font-black text-content-primary mt-2 block">
            {activeDraws?.daily ? formatCountdown(getTimeRemainingMs(activeDraws.daily.ends_at)) : (isRtl ? 'نشط' : 'Active')}
          </span>
          <span className="text-[11px] text-content-muted block mt-1">
            {isRtl ? 'أجهزة وهواتف ذكية رائدة' : 'Flagship smartphones'}
          </span>
        </div>

        {/* Monthly Grand Prize */}
        <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-content-secondary">
            <span>{isRtl ? 'الجائزة الكبرى الشهرية' : 'Monthly Grand Prize'}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <span className="font-mono text-2xl font-black text-content-primary mt-2 block">
            {activeDraws?.monthly ? formatCountdown(getTimeRemainingMs(activeDraws.monthly.ends_at)) : (isRtl ? 'نشط' : 'Active')}
          </span>
          <span className="text-[11px] text-content-muted block mt-1">
            {isRtl ? 'سيارة شيري تيجو 8 برو ماكس 2026' : 'Chery Tiggo 8 Pro Max 2026'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-border-subtle">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-content-muted absolute inset-inline-start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRtl ? 'بحث برقم التذكرة أو رقم الطلب...' : 'Search by serial or order #...'}
              className="w-full ps-9 pe-3 py-2 rounded-xl border border-border-subtle bg-input-bg text-content-primary text-xs focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="text-xs text-content-secondary font-medium self-end sm:self-auto">
            <span>{filteredTickets.length} {isRtl ? 'تذكرة معروضة' : 'tickets displayed'}</span>
          </div>
        </div>

        {/* Tickets Grid / List */}
        {isLoading ? (
          <div className="min-h-[300px] flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-semibold">{isRtl ? 'جاري جلب تذاكرك الترويجية...' : 'Loading your tickets...'}</p>
          </div>
        ) : isError ? (
          <div className="p-8 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-500/30 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <h3 className="font-bold text-base text-red-900 dark:text-red-200">
              {isRtl ? 'تعذر جلب التذاكر' : 'Failed to Load Tickets'}
            </h3>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
            >
              {isRtl ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : isEmpty ? (
          <div className="p-12 rounded-3xl bg-surface border border-dashed border-border-subtle text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
              <Ticket className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-content-primary">
              {isRtl ? 'لا توجد لديك تذاكر سحب حتى الآن' : 'No Raffle Tickets Yet'}
            </h3>
            <p className="text-sm text-content-secondary max-w-md mx-auto leading-relaxed">
              {isRtl
                ? 'تحصل على تذكرة سحب ترويجية مجانية مع كل جزء تدريبي مهني تشتريه (2$)، أو 15 تذكرة كاملة عند شراء الحقيبة الشاملة (10$).'
                : 'Receive complimentary promotional tickets with each vocational course purchased.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRtl ? 'تصفح الدورات وابدأ الآن' : 'Browse Courses & Get Tickets'}</span>
            </Link>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface border border-border-subtle text-center text-xs text-content-muted">
            {isRtl ? 'لم يتم العثور على تذاكر تطابق بحثك.' : 'No tickets match your search query.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTickets.map((ticket: TicketItem) => (
              <div
                key={ticket.id}
                className="p-4 rounded-2xl bg-surface border border-border-subtle hover:border-border transition-all shadow-2xs space-y-3"
              >
                {/* Serial Bar */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border-subtle">
                  <div className="flex items-center gap-1.5 font-mono text-sm font-black text-content-primary tracking-wider">
                    <Ticket className="w-4 h-4 text-accent" />
                    <span>{ticket.serial_number}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopySerial(ticket.serial_number)}
                    className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-secondary transition-colors cursor-pointer"
                    title={isRtl ? 'نسخ رقم التذكرة' : 'Copy serial'}
                  >
                    {copiedSerial === ticket.serial_number ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Metadata */}
                <div className="space-y-1 text-xs text-content-secondary">
                  <div className="flex justify-between">
                    <span className="text-content-muted">{isRtl ? 'تاريخ الإصدار:' : 'Issued:'}</span>
                    <span>
                      {new Date(ticket.issued_at).toLocaleDateString(isRtl ? 'ar-IQ' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {ticket.originating_order_number && (
                    <div className="flex justify-between">
                      <span className="text-content-muted">{isRtl ? 'الطلب المرجعي:' : 'Order Ref:'}</span>
                      <Link
                        href={`/orders/${ticket.originating_order_number}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {ticket.originating_order_number}
                      </Link>
                    </div>
                  )}
                </div>

                {/* Eligibility Badges */}
                <div className="pt-2 border-t border-border-subtle">
                  <span className="text-[10px] text-content-muted font-semibold block mb-1.5">
                    {isRtl ? 'حالة الأهلية للسحوبات المباشرة:' : 'Draws Eligibility:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isRtl ? 'ساعي' : 'Hourly'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isRtl ? 'يومي' : 'Daily'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Sparkles className="w-3 h-3" />
                      <span>{isRtl ? 'الجائزة الكبرى' : 'Grand Prize'}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legal & Compliance Notice */}
      <div className="p-4 rounded-2xl bg-surface-secondary/60 border border-border-subtle flex items-start gap-3 text-xs text-content-muted leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p>
          {isRtl
            ? 'تنبيه قانوني: جميع تذاكر السحب الترويجية تصدر تلقائياً كهدية تسويقية مجانية مرافقة لشراء الدورات المهنية، وفقاً لقانون حماية المستهلك العراقي رقم (1) لسنة 2010. التذاكر غير قابلة للشراء المنفصل أو الاسترداد المالي، ويتم توثيق السحوبات عبر التشفير الإلكتروني والبث المباشر.'
            : 'Legal disclaimer: All promotional tickets are issued as complimentary promotional gifts accompanying vocational course purchases under Iraqi Consumer Protection Law No. 1 (2010). Tickets cannot be purchased separately.'}
        </p>
      </div>
    </div>
  );
}
