import { AdminCapability } from '@/types/admin';
import { hasCapability } from './capabilities';

export interface AdminNavItem {
  id: string;
  path: string;
  labelKey: string;
  icon: string;
  requiredCapabilities?: AdminCapability[]; // If defined, user must possess at least one
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'dashboard',
    path: '/admin',
    labelKey: 'admin.nav.dashboard',
    icon: 'LayoutDashboard',
  },
  {
    id: 'settings',
    path: '/admin/settings',
    labelKey: 'admin.nav.settings',
    icon: 'Settings',
    requiredCapabilities: ['manage_platform_settings'],
  },
  {
    id: 'affiliates',
    path: '/admin/affiliates',
    labelKey: 'admin.nav.affiliates',
    icon: 'Users',
    requiredCapabilities: ['manage_platform_settings', 'settle_affiliate_payout'],
  },
  {
    id: 'payouts',
    path: '/admin/payouts',
    labelKey: 'admin.nav.payouts',
    icon: 'BadgeDollarSign',
    requiredCapabilities: ['settle_affiliate_payout'],
  },
  {
    id: 'coprizes',
    path: '/admin/coprizes',
    labelKey: 'admin.nav.coprizes',
    icon: 'Trophy',
    requiredCapabilities: ['adjudicate_affiliate_coprize'],
  },
  {
    id: 'approvals',
    path: '/admin/approvals',
    labelKey: 'admin.nav.approvals',
    icon: 'ShieldCheck',
    requiredCapabilities: ['issue_kyc_approval', 'issue_draw_audit_approval'],
  },
  {
    id: 'draws',
    path: '/admin/draws',
    labelKey: 'admin.nav.draws',
    icon: 'Sparkles',
    requiredCapabilities: ['manage_platform_settings'],
  },
  {
    id: 'courses',
    path: '/admin/courses',
    labelKey: 'admin.nav.courses',
    icon: 'BookOpen',
    requiredCapabilities: ['manage_platform_settings'],
  },
  {
    id: 'awards',
    path: '/admin/awards',
    labelKey: 'admin.nav.awards',
    icon: 'Gift',
    requiredCapabilities: ['manage_platform_settings'],
  },
  {
    id: 'users',
    path: '/admin/users',
    labelKey: 'admin.nav.users',
    icon: 'UserCheck',
    requiredCapabilities: ['manage_admin_capabilities'],
  },
  {
    id: 'audit',
    path: '/admin/audit',
    labelKey: 'admin.nav.audit',
    icon: 'ScrollText',
    requiredCapabilities: ['manage_admin_capabilities'],
  },
];

export const ADMIN_NAV_LABELS: Record<string, { ar: string; en: string }> = {
  dashboard: { ar: 'لوحة التحكم الإدارية', en: 'Dashboard' },
  settings: { ar: 'إعدادات المنصة', en: 'Platform Settings' },
  affiliates: { ar: 'دليل المسوقين', en: 'Affiliate Oversight' },
  payouts: { ar: 'طلبات السحب', en: 'Payout Settlements' },
  coprizes: { ar: 'جوائز الشركاء (40%)', en: 'Co-Prize Adjudication' },
  approvals: { ar: 'سجل الموافقات والتدقيق', en: 'Approvals & Audit' },
  draws: { ar: 'السحوبات والجوائز', en: 'Draws & Prizes' },
  courses: { ar: 'إدارة الدورات التدريبية', en: 'Course Management' },
  awards: { ar: 'تذاكر ترويجية إدارية', en: 'Promotional Awards' },
  users: { ar: 'المستخدمون والصلاحيات', en: 'Users & Capabilities' },
  audit: { ar: 'سجل العمليات والرقابة', en: 'Audit Logs' },
};

export function getAdminNavLabel(id: string, locale: string): string {
  const entry = ADMIN_NAV_LABELS[id];
  if (!entry) return id;
  return locale === 'ar' ? entry.ar : entry.en;
}

// Presentation filter only. The backend (admin principal middleware plus per-route
// capability middleware) remains the authority; hiding an item never grants or removes access.
export function getVisibleAdminNavItems(capabilities: AdminCapability[]): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => {
    if (!item.requiredCapabilities || item.requiredCapabilities.length === 0) {
      return true;
    }
    return hasCapability(capabilities, item.requiredCapabilities);
  });
}

export interface AdminNavSubItem {
  id: string;
  path: string;
  labelAr: string;
  labelEn: string;
  icon?: string;
  requiredCapabilities?: AdminCapability[];
}

export interface AdminNavGroupItem {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: string;
  path?: string; // Standalone route
  subItems?: AdminNavSubItem[]; // Collapsible subpages
  requiredCapabilities?: AdminCapability[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroupItem[] = [
  {
    id: 'dashboard',
    labelAr: 'لوحة التحكم الإدارية',
    labelEn: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/admin',
  },
  {
    id: 'users',
    labelAr: 'المستخدمون والصلاحيات',
    labelEn: 'Users & Capabilities',
    icon: 'UserCheck',
    path: '/admin/users',
    requiredCapabilities: ['manage_admin_capabilities'],
  },
  {
    id: 'courses',
    labelAr: 'إدارة الدورات التدريبية',
    labelEn: 'Course Management',
    icon: 'BookOpen',
    path: '/admin/courses',
    requiredCapabilities: ['manage_platform_settings'],
  },
  {
    id: 'landing_cms',
    labelAr: 'إدارة الصفحة الرئيسية (CMS)',
    labelEn: 'Landing Page CMS',
    icon: 'Globe',
    requiredCapabilities: ['manage_platform_settings'],
    subItems: [
      {
        id: 'hero',
        path: '/admin/landing/hero',
        labelAr: 'البانر الرئيسي (Hero)',
        labelEn: 'Hero Section',
        icon: 'Sparkles',
      },
      {
        id: 'skill_capital',
        path: '/admin/landing/skill-capital',
        labelAr: 'المهارة هي رأس المال',
        labelEn: 'Skill & Capital',
        icon: 'BookOpen',
      },
      {
        id: 'courses_display',
        path: '/admin/landing/courses-display',
        labelAr: 'عرض الدورات والمناهج',
        labelEn: 'Courses Display',
        icon: 'BookOpen',
      },
      {
        id: 'promotional_banner',
        path: '/admin/landing/promotional-banner',
        labelAr: 'البانر الترويجي',
        labelEn: 'Promotional Banner',
        icon: 'Gift',
      },
      {
        id: 'promotional_referral',
        path: '/admin/landing/promotional-referral',
        labelAr: 'برنامج الإحالة الترويجي',
        labelEn: 'Promotional Referral',
        icon: 'Users',
      },
      {
        id: 'free_referral',
        path: '/admin/landing/free-referral',
        labelAr: 'بطاقة التذكرة المجانية',
        labelEn: 'Free Referral Card',
        icon: 'Gift',
      },
      {
        id: 'legal_compliance',
        path: '/admin/landing/legal-compliance',
        labelAr: 'النصوص القانونية والامتثال',
        labelEn: 'Legal & Compliance',
        icon: 'ShieldCheck',
      },
      {
        id: 'referral_faq',
        path: '/admin/landing/referral-faq',
        labelAr: 'الأسئلة الشائعة حول المنصة',
        labelEn: 'Referral FAQ',
        icon: 'ScrollText',
      },
      {
        id: 'ticket_ladder',
        path: '/admin/landing/ticket-ladder',
        labelAr: 'سلم التذاكر الترويجية',
        labelEn: 'Ticket Ladder',
        icon: 'BadgeDollarSign',
      },
    ],
  },
  {
    id: 'affiliates_group',
    labelAr: 'نظام الشركاء والإحالات',
    labelEn: 'Affiliate & Referral',
    icon: 'Users',
    requiredCapabilities: ['manage_platform_settings', 'settle_affiliate_payout'],
    subItems: [
      {
        id: 'affiliates_oversight',
        path: '/admin/affiliates',
        labelAr: 'دليل المسوقين والرقابة',
        labelEn: 'Affiliate Oversight',
        icon: 'Users',
      },
      {
        id: 'affiliates_content',
        path: '/admin/affiliates/content',
        labelAr: 'محتوى صفحة الشركاء',
        labelEn: 'Partner Page Content',
        icon: 'Globe',
      },
    ],
  },
  {
    id: 'draws_group',
    labelAr: 'إدارة السحوبات والنتائج',
    labelEn: 'Draw Management',
    icon: 'Sparkles',
    requiredCapabilities: ['manage_platform_settings'],
    subItems: [
      {
        id: 'draws_prizes',
        path: '/admin/draws',
        labelAr: 'السحوبات والجوائز',
        labelEn: 'Draws & Prizes',
        icon: 'Sparkles',
      },
      {
        id: 'hall_of_fame',
        path: '/admin/draws/hall-of-fame',
        labelAr: 'لوحة الشرف وتوثيق الفائزين',
        labelEn: 'Hall of Fame Presentation',
        icon: 'Trophy',
      },
      {
        id: 'draws_media',
        path: '/admin/draws/media',
        labelAr: 'البودكاست والبث المباشر',
        labelEn: 'Watch Live & Podcast',
        icon: 'Globe',
      },
    ],
  },
  {
    id: 'payouts',
    labelAr: 'طلبات السحب',
    labelEn: 'Payout Settlements',
    icon: 'BadgeDollarSign',
    path: '/admin/payouts',
    requiredCapabilities: ['settle_affiliate_payout'],
  },
  {
    id: 'coprizes',
    labelAr: 'جوائز الشركاء (40%)',
    labelEn: 'Co-Prize Adjudication',
    icon: 'Trophy',
    path: '/admin/coprizes',
    requiredCapabilities: ['adjudicate_affiliate_coprize'],
  },
  {
    id: 'approvals',
    labelAr: 'سجل الموافقات والتدقيق',
    labelEn: 'Approvals & Audit',
    icon: 'ShieldCheck',
    path: '/admin/approvals',
    requiredCapabilities: ['issue_kyc_approval', 'issue_draw_audit_approval'],
  },
  {
    id: 'awards',
    labelAr: 'تذاكر ترويجية إدارية',
    labelEn: 'Promotional Awards',
    icon: 'Gift',
    path: '/admin/awards',
    requiredCapabilities: ['manage_platform_settings'],
  },
  {
    id: 'settings',
    labelAr: 'إعدادات المنصة',
    labelEn: 'Platform Settings',
    icon: 'Settings',
    path: '/admin/settings',
    requiredCapabilities: ['manage_platform_settings'],
  },
  {
    id: 'audit',
    labelAr: 'سجل العمليات والرقابة',
    labelEn: 'Audit Logs',
    icon: 'ScrollText',
    path: '/admin/audit',
    requiredCapabilities: ['manage_admin_capabilities'],
  },
];

export function getVisibleAdminNavGroups(capabilities: AdminCapability[]): AdminNavGroupItem[] {
  return ADMIN_NAV_GROUPS.filter((group) => {
    if (!group.requiredCapabilities || group.requiredCapabilities.length === 0) {
      return true;
    }
    return hasCapability(capabilities, group.requiredCapabilities);
  }).map((group) => {
    if (!group.subItems) {
      return group;
    }
    // Filter sub-items by capability if defined
    const visibleSubItems = group.subItems.filter((sub) => {
      if (!sub.requiredCapabilities || sub.requiredCapabilities.length === 0) {
        return true;
      }
      return hasCapability(capabilities, sub.requiredCapabilities);
    });
    return {
      ...group,
      subItems: visibleSubItems,
    };
  });
}

