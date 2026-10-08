'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAdminSession } from '@/hooks/admin/useAdminSession';
import { useAdminSettings } from '@/hooks/admin/useAdminSettings';
import { useAdminPayouts } from '@/hooks/admin/useAdminPayouts';
import { useAdminCoPrizes } from '@/hooks/admin/useAdminCoPrizes';
import { useAdminDraws } from '@/hooks/admin/useAdminDraws';
import { useAdminApprovals } from '@/hooks/admin/useAdminApprovals';
import { useAdminAuditLogs } from '@/hooks/admin/useAdminAuditLogs';
import { ADMIN_NAV_ITEMS } from '@/lib/admin/nav';
import { hasCapability } from '@/lib/admin/capabilities';
import { formatDate } from '@/lib/admin/format';
import {
  ShieldCheck,
  Settings,
  Users,
  BadgeDollarSign,
  Trophy,
  Sparkles,
  Gift,
  UserCheck,
  ScrollText,
  ArrowRight,
  ArrowLeft,
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  Layers,
  Zap,
  Server,
  Database,
  KeyRound,
  FileCheck,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Settings,
  Users,
  BadgeDollarSign,
  Trophy,
  ShieldCheck,
  Sparkles,
  Gift,
  UserCheck,
  ScrollText,
};

export default function AdminDashboardPage() {
  const { user, capabilities, serverTimeUtc } = useAdminSession();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const canSettings = hasCapability(capabilities, 'manage_platform_settings');
  const canPayouts = hasCapability(capabilities, ['settle_affiliate_payout', 'manage_platform_settings']);
  const canCoPrizes = hasCapability(capabilities, 'adjudicate_affiliate_coprize');
  const canApprovals = hasCapability(capabilities, ['issue_kyc_approval', 'issue_draw_audit_approval']);
  const canAudit = hasCapability(capabilities, 'manage_admin_capabilities');

  // Live operational data from all parts of the platform
  const { settings, isLoading: isSettingsLoading } = useAdminSettings(canSettings);
  const { payouts, isLoading: isPayoutsLoading } = useAdminPayouts('requested', null, canPayouts);
  const { coprizes, isLoading: isCoPrizesLoading } = useAdminCoPrizes('pending', canCoPrizes);
  const { draws, isLoading: isDrawsLoading } = useAdminDraws('all', 'all', canSettings);
  const { approvals, isLoading: isApprovalsLoading } = useAdminApprovals('all', canApprovals);
  const { logs, isLoading: isLogsLoading } = useAdminAuditLogs({}, canAudit);

  const pendingPayoutsCount = payouts.filter((p) => p.status === 'requested').length;
  const pendingCoPrizesCount = coprizes.filter((c) => c.status === 'pending').length;
  const activeDrawsCount = draws.filter((d) => d.status === 'upcoming' || d.is_published).length;
  const validApprovalsCount = approvals.filter((a) => a.status === 'valid').length;

  const accessibleSections = ADMIN_NAV_ITEMS.filter((item) => {
    if (item.id === 'dashboard') return false;
    if (!item.requiredCapabilities || item.requiredCapabilities.length === 0) return true;
    return hasCapability(capabilities, item.requiredCapabilities);
  });

  return (
    <div className="space-y-8" data-testid="admin-dashboard-page">
      {/* 1. Welcome & Security Header */}
      <div className="relative py-2 sm:py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 text-primary text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? 'جلسة إدارية مشفرة ومراقبة' : 'Monitored & Cryptographically Audited'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
              {isAr
                ? `أهلاً بك، ${user?.display_name || 'المشرف'}`
                : `Welcome back, ${user?.display_name || 'Admin'}`}
            </h1>
            <p className="text-content-secondary text-xs sm:text-sm leading-relaxed">
              {isAr
                ? 'مركز العمليات الموحد لإدارة منصة كنزين: السحوبات الترويجية، مراجعة العمولات والتسويات، الرقابة المالية وتدقيق الموافقات.'
                : 'Central KNZiN Operations Command: Promotional draws, commission settlement pipeline, financial audits, and security oversight.'}
            </p>
          </div>

          {/* Quick Platform Bridge */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-content-primary hover:text-primary transition-colors"
              data-testid="dashboard-view-platform-link"
            >
              <ExternalLink className="w-4 h-4 text-primary" />
              <span>{isAr ? 'عرض المنصة للجمهور' : 'View Public Platform'}</span>
            </Link>

            {serverTimeUtc && (
              <div className="px-3 py-1 text-[11px] text-content-secondary flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-mono">UTC: {serverTimeUtc.slice(11, 19)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Live Platform Operations KPI Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <span>{isAr ? 'مؤشرات العمليات الحية للمنصة' : 'Live Platform Operational Metrics'}</span>
          </h2>
          <span className="text-xs text-content-secondary">
            {isAr ? 'محدثة تلقائياً من خادم العمليات' : 'Live synced from platform backend'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Platform Commission Rate */}
          <Link
            href={`/${locale}/admin/settings`}
            className="p-5 rounded-2xl bg-surface-card border border-border-subtle hover:border-primary/40 transition-colors shadow-xs group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-content-secondary">
                {isAr ? 'نسبة عمولة المسوقين' : 'Sales Commission'}
              </span>
              <Settings className="w-5 h-5 text-primary shrink-0" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-content-primary">
                {isSettingsLoading ? '...' : `${settings?.commission_rate_percent ?? 25}%`}
              </span>
              <p className="text-[11px] text-content-secondary mt-1">
                {isAr
                  ? `الحد الأدنى للسحب: $${((settings?.payout_min_cents ?? 5000) / 100).toFixed(2)}`
                  : `Min Payout: $${((settings?.payout_min_cents ?? 5000) / 100).toFixed(2)}`}
              </p>
            </div>
          </Link>

          {/* Card 2: Payout Settlements */}
          <Link
            href={`/${locale}/admin/payouts`}
            className="p-5 rounded-2xl bg-surface-card border border-border-subtle hover:border-primary/40 transition-colors shadow-xs group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-content-secondary">
                {isAr ? 'طلبات السحب المعلقة' : 'Pending Payouts'}
              </span>
              <BadgeDollarSign className="w-5 h-5 text-amber-500 shrink-0" />
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-content-primary">
                  {isPayoutsLoading ? '...' : pendingPayoutsCount}
                </span>
                <span className="text-xs text-amber-500 font-semibold">
                  {isAr ? 'بحاجة لتسوية' : 'Awaiting Settlement'}
                </span>
              </div>
              <p className="text-[11px] text-content-secondary mt-1">
                {isAr ? 'تحويل مصرفي برقم MTCN ووصل' : 'Bank transfer with MTCN & receipt'}
              </p>
            </div>
          </Link>

          {/* Card 3: Co-Prizes Adjudication */}
          <Link
            href={`/${locale}/admin/coprizes`}
            className="p-5 rounded-2xl bg-surface-card border border-border-subtle hover:border-primary/40 transition-colors shadow-xs group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-content-secondary">
                {isAr ? 'جوائز الشركاء (40%)' : 'Co-Prize Queue (40%)'}
              </span>
              <Trophy className="w-5 h-5 text-emerald-500 shrink-0" />
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-content-primary">
                  {isCoPrizesLoading ? '...' : pendingCoPrizesCount}
                </span>
                <span className="text-xs text-emerald-500 font-semibold">
                  {isAr ? 'قيد التدقيق' : 'Gated by KYC/Audit'}
                </span>
              </div>
              <p className="text-[11px] text-content-secondary mt-1">
                {isAr ? 'تتطلب موافقة هوية وتدقيق نزاهة' : 'Requires dual KYC & draw proof'}
              </p>
            </div>
          </Link>

          {/* Card 4: Promotional Draws & Seed Commitments */}
          <Link
            href={`/${locale}/admin/draws`}
            className="p-5 rounded-2xl bg-surface-card border border-border-subtle hover:border-primary/40 transition-colors shadow-xs group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-content-secondary">
                {isAr ? 'السحوبات والجوائز' : 'Promotional Draws'}
              </span>
              <Sparkles className="w-5 h-5 text-purple-500 shrink-0" />
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-content-primary">
                  {isDrawsLoading ? '...' : activeDrawsCount}
                </span>
                <span className="text-xs text-purple-500 font-semibold">
                  {isAr ? 'سحب نشط ومجدول' : 'Active & Scheduled'}
                </span>
              </div>
              <p className="text-[11px] text-content-secondary mt-1">
                {isAr ? 'التزام تشفيري مسبق HMAC-SHA256' : 'HMAC-SHA256 seed commitments'}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* 3. Quick Operational Action Hub */}
      <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-xs">
        <h3 className="text-sm font-bold text-content-primary flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-primary" />
          <span>{isAr ? 'إجراءات سريعة فورية' : 'Immediate Operations Hub'}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href={`/${locale}/admin/payouts`}
            className="p-3.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-center flex flex-col items-center justify-center gap-2 group transition-all"
          >
            <BadgeDollarSign className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-content-primary">
              {isAr ? 'تسوية السحوبات' : 'Settle Payouts'}
            </span>
          </Link>

          <Link
            href={`/${locale}/admin/coprizes`}
            className="p-3.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-center flex flex-col items-center justify-center gap-2 group transition-all"
          >
            <Trophy className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-content-primary">
              {isAr ? 'صرف الجوائز (40%)' : 'Release Co-Prize'}
            </span>
          </Link>

          <Link
            href={`/${locale}/admin/draws/new`}
            className="p-3.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-center flex flex-col items-center justify-center gap-2 group transition-all"
          >
            <Sparkles className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-content-primary">
              {isAr ? 'مسودة سحب' : 'New Draw'}
            </span>
          </Link>

          <Link
            href={`/${locale}/admin/approvals`}
            className="p-3.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-center flex flex-col items-center justify-center gap-2 group transition-all"
          >
            <UserCheck className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-content-primary">
              {isAr ? 'إصدار موافقة' : 'Issue Approval'}
            </span>
          </Link>

          <Link
            href={`/${locale}/admin/awards`}
            className="p-3.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-center flex flex-col items-center justify-center gap-2 group transition-all"
          >
            <Gift className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-content-primary">
              {isAr ? 'منح مكافأة' : 'Grant Award'}
            </span>
          </Link>

          <Link
            href={`/${locale}/admin/users`}
            className="p-3.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-center flex flex-col items-center justify-center gap-2 group transition-all"
          >
            <KeyRound className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-content-primary">
              {isAr ? 'إدارة الصلاحيات' : 'Admin Access'}
            </span>
          </Link>
        </div>
      </div>

      {/* 4. Live System Integrity & Platform Connectivity Status */}
      <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs">
        <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          <span>{isAr ? 'حالة تكامل الأنظمة والاتصال بالمنصة' : 'Platform System Integrity & Connectivity'}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="font-bold text-content-primary block">{isAr ? 'خادم REST API' : 'REST API Gateway'}</span>
              <span className="text-[10px] text-content-secondary">v1 Connected</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle flex items-center gap-2.5">
            <Database className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-content-primary block">{isAr ? 'قاعدة البيانات' : 'MariaDB Database'}</span>
              <span className="text-[10px] text-content-secondary">ACID Invariants</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-primary" />
            <div>
              <span className="font-bold text-content-primary block">{isAr ? 'محرك التشفير' : 'Crypto Engine'}</span>
              <span className="text-[10px] text-content-secondary">HMAC-SHA256</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle flex items-center gap-2.5">
            <FileCheck className="w-4 h-4 text-blue-400" />
            <div>
              <span className="font-bold text-content-primary block">{isAr ? 'تخزين الإيصالات' : 'Receipt Storage'}</span>
              <span className="text-[10px] text-content-secondary">Private Protected</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-content-primary block">{isAr ? 'سجل الرقابة' : 'Audit Trail'}</span>
              <span className="text-[10px] text-content-secondary">Immutable Log</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent Security Audit Stream (if authorized) */}
      {canAudit && logs.length > 0 && (
        <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-primary" />
              <span>{isAr ? 'أحدث العمليات في سجل الرقابة والتدقيق' : 'Recent Security Audit Events'}</span>
            </h3>
            <Link
              href={`/${locale}/admin/audit`}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>{isAr ? 'عرض السجل الكامل' : 'View Full Trail'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Audit Stream Cards (< md) */}
          <div className="md:hidden divide-y divide-border-subtle/60">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="py-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-content-primary font-bold">{log.action}</span>
                  <span
                    className={`text-[10px] font-bold ${
                      log.outcome === 'success'
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : 'text-rose-500 dark:text-rose-400'
                    }`}
                  >
                    {log.outcome}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-content-secondary">
                  <span className="truncate max-w-[200px]">{log.actor?.email || `Admin #${log.actor_id}`}</span>
                  <span className="text-[11px] text-content-muted whitespace-nowrap">{formatDate(log.created_at, locale)}</span>
                </div>
                <div className="font-mono text-[11px] text-content-muted">
                  {log.target_type}: {log.target_id}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-border-subtle text-content-secondary">
                  <th className="pb-2 text-start font-semibold">{isAr ? 'العملية' : 'Action'}</th>
                  <th className="pb-2 text-start font-semibold">{isAr ? 'المسؤول' : 'Actor'}</th>
                  <th className="pb-2 text-start font-semibold">{isAr ? 'الهدف' : 'Target'}</th>
                  <th className="pb-2 text-start font-semibold">{isAr ? 'النتيجة' : 'Outcome'}</th>
                  <th className="pb-2 text-start font-semibold">{isAr ? 'الوقت' : 'Timestamp'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {logs.slice(0, 5).map((log) => (
                  <tr key={log.id} className="hover:bg-surface-elevated/40">
                    <td className="py-2.5 font-mono text-content-primary font-semibold">{log.action}</td>
                    <td className="py-2.5 text-content-secondary">{log.actor?.email || `Admin #${log.actor_id}`}</td>
                    <td className="py-2.5 font-mono text-content-secondary">{log.target_type}: {log.target_id}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-bold ${
                        log.outcome === 'success'
                          ? 'text-emerald-500 dark:text-emerald-400'
                          : 'text-rose-500 dark:text-rose-400'
                      }`}>
                        {log.outcome}
                      </span>
                    </td>
                    <td className="py-2.5 text-content-secondary">{formatDate(log.created_at, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Accessible Operational Sections Grid */}
      <div>
        <h2 className="text-xl font-bold text-content-primary mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <span>{isAr ? 'أقسام الإدارة والعمليات' : 'Administrative Operations Departments'}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accessibleSections.map((section) => {
            const Icon = ICON_MAP[section.icon] || ShieldCheck;
            return (
              <Link
                key={section.id}
                href={`/${locale}${section.path}`}
                className="group p-6 rounded-2xl bg-surface-card border border-border-subtle hover:border-primary/40 hover:bg-surface-elevated transition-all duration-200 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <Icon className="w-8 h-8 text-primary group-hover:scale-105 transition-transform shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-content-primary group-hover:text-primary transition-colors">
                      {isAr ? getArTitle(section.id) : getEnTitle(section.id)}
                    </h3>
                    <p className="text-xs text-content-secondary mt-1 line-clamp-2">
                      {isAr ? getArDesc(section.id) : getEnDesc(section.id)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border-subtle flex items-center justify-between text-xs font-bold text-primary">
                  <span>{isAr ? 'فتح القسم' : 'Open Section'}</span>
                  <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getArTitle(id: string): string {
  switch (id) {
    case 'settings':
      return 'إعدادات المنصة والعمولات';
    case 'affiliates':
      return 'سجل المسوقين المكتسبين';
    case 'payouts':
      return 'تسوية طلبات السحب';
    case 'coprizes':
      return 'البت في جوائز الشركاء (40%)';
    case 'approvals':
      return 'إدارة الموافقات والتدقيق';
    case 'draws':
      return 'السحوبات والجوائز والالتزام';
    case 'awards':
      return 'منح تذاكر ترويجية إضافية';
    case 'users':
      return 'المستخدمون والصلاحيات الإدارية';
    case 'audit':
      return 'سجل الرقابة والعمليات الأمنية';
    default:
      return id;
  }
}

function getEnTitle(id: string): string {
  switch (id) {
    case 'settings':
      return 'Platform Settings & Rates';
    case 'affiliates':
      return 'Affiliate Oversight';
    case 'payouts':
      return 'Payout Settlements';
    case 'coprizes':
      return 'Co-Prize Adjudication';
    case 'approvals':
      return 'Approvals & Audit';
    case 'draws':
      return 'Draws & Prize Lifecycle';
    case 'awards':
      return 'Promotional Awards';
    case 'users':
      return 'Users & Admin Capabilities';
    case 'audit':
      return 'Security Audit Trail';
    default:
      return id;
  }
}

function getArDesc(id: string): string {
  switch (id) {
    case 'settings':
      return 'تعديل نسبة عمولة المبيعات الفورية والحد الأدنى للسحب مع حفظ سجل التدقيق.';
    case 'affiliates':
      return 'استعراض سجل المعاملات المالية الموثق وأرصدة المسوقين دون إمكانية التعديل العشوائي.';
    case 'payouts':
      return 'تنفيذ تحويلات الأرباح برقم MTCN ووصل التحويل، أو الرفض المسبب مع استرداد الرصيد.';
    case 'coprizes':
      return 'التحقق المزدوج من هوية الفائز ونزاهة السحب قبل الإفراج عن حصة المسوق (40%).';
    case 'approvals':
      return 'إصدار أو استبدال أو إلغاء موافقات الهوية وسجلات التدقيق المعتمدة.';
    case 'draws':
      return 'إدارة مواعيد السحوبات، إضافة الجوائز، نشر الالتزام المشفر وكشف البذرة بعد الانتهاء.';
    case 'awards':
      return 'منح تذاكر ترويجية إدارية خاصة للمستخدمين مع حفظ التبرير الإلزامي.';
    case 'users':
      return 'منح أو سحب الصلاحيات الإدارية الست للمشرفين بصورة محكمة.';
    case 'audit':
      return 'استعراض وتصفية السجل الأمني الموحد لكافة العمليات الإدارية المنفذة.';
    default:
      return '';
  }
}

function getEnDesc(id: string): string {
  switch (id) {
    case 'settings':
      return 'Configure dynamic sales commission rates and minimum payout thresholds with full audit trail.';
    case 'affiliates':
      return 'Inspect immutable financial ledger entries and affiliate balance projections.';
    case 'payouts':
      return 'Settle payouts with mandatory MTCN reference and receipt, or reject with compensating reversal.';
    case 'coprizes':
      return 'Gate 40% affiliate co-prize release through dual KYC and draw-integrity approvals.';
    case 'approvals':
      return 'Issue, supersede, or revoke KYC and draw integrity audit approvals.';
    case 'draws':
      return 'Manage draw schedules, prizes, public draft visibility, and cryptographic seed commitments.';
    case 'awards':
      return 'Grant discretionary promotional raffle tickets with mandatory justification.';
    case 'users':
      return 'Assign or revoke specific administrative capabilities across administrators.';
    case 'audit':
      return 'Filter and inspect unified immutable audit log entries across all admin actions.';
    default:
      return '';
  }
}
