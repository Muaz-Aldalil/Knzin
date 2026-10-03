'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAdminSession } from '@/hooks/admin/useAdminSession';
import { ADMIN_NAV_ITEMS } from '@/lib/admin/nav';
import { hasCapability } from '@/lib/admin/capabilities';
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
  const { user, capabilities } = useAdminSession();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const accessibleSections = ADMIN_NAV_ITEMS.filter((item) => {
    if (item.id === 'dashboard') return false;
    if (!item.requiredCapabilities || item.requiredCapabilities.length === 0) return true;
    return hasCapability(capabilities, item.requiredCapabilities);
  });

  return (
    <div className="space-y-8" data-testid="admin-dashboard-page">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-card via-surface-card to-brand-navy/60 border border-border-subtle p-8 shadow-xs">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>{isAr ? 'جلسة مشفرة ومراقبة' : 'Monitored & Audited Session'}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-content-primary tracking-tight">
            {isAr
              ? `أهلاً بك، ${user?.display_name || 'المشرف'}`
              : `Welcome back, ${user?.display_name || 'Admin'}`}
          </h1>
          <p className="text-content-secondary text-sm leading-relaxed">
            {isAr
              ? 'لوحة العمليات المركزية لإدارة المنصة، السحوبات، مراجعة العمولات وتدقيق النزاهة المالية وفق أعلى معايير الشفافية.'
              : 'Central operations portal for platform controls, promotional draws, affiliate settlements, and financial audit integrity.'}
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            {capabilities.map((cap) => (
              <span
                key={cap}
                className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-border-subtle text-xs font-mono text-content-secondary"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Accessible Operational Sections */}
      <div>
        <h2 className="text-xl font-bold text-content-primary mb-4">
          {isAr ? 'الأقسام المتاحة لك' : 'Available Sections'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accessibleSections.map((section) => {
            const Icon = ICON_MAP[section.icon] || ShieldCheck;
            return (
              <Link
                key={section.id}
                href={`/${locale}${section.path}`}
                className="group p-6 rounded-2xl bg-surface-card border border-border-subtle hover:border-brand-gold/40 hover:bg-surface-elevated transition-all duration-200 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-content-primary group-hover:text-brand-gold transition-colors">
                      {isAr ? getArTitle(section.id) : getEnTitle(section.id)}
                    </h3>
                    <p className="text-xs text-content-secondary mt-1 line-clamp-2">
                      {isAr ? getArDesc(section.id) : getEnDesc(section.id)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border-subtle flex items-center justify-between text-xs font-bold text-brand-gold">
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
