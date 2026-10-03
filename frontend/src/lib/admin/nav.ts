import { AdminCapability } from '@/types/admin';

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
