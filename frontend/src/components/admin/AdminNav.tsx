'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ADMIN_NAV_ITEMS, AdminNavItem } from '@/lib/admin/nav';
import { hasCapability } from '@/lib/admin/capabilities';
import { AdminCapability } from '@/types/admin';
import {
  LayoutDashboard,
  Settings,
  Users,
  BadgeDollarSign,
  Trophy,
  ShieldCheck,
  Sparkles,
  Gift,
  UserCheck,
  ScrollText,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
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

interface AdminNavProps {
  capabilities: AdminCapability[];
  onItemClick?: () => void;
}

export function AdminNav({ capabilities, onItemClick }: AdminNavProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const isAr = locale === 'ar';

  const visibleItems = ADMIN_NAV_ITEMS.filter((item) => {
    if (!item.requiredCapabilities || item.requiredCapabilities.length === 0) {
      return true;
    }
    return hasCapability(capabilities, item.requiredCapabilities);
  });

  return (
    <nav className="space-y-1.5 px-3 py-4" data-testid="admin-nav">
      {visibleItems.map((item) => {
        const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
        const targetPath = `/${locale}${item.path}`;
        const isActive =
          item.path === '/admin'
            ? pathname === targetPath
            : pathname?.startsWith(targetPath);

        // Fallback labels if translation missing
        const label = isAr
          ? getArLabel(item.id)
          : getEnLabel(item.id);

        return (
          <Link
            key={item.id}
            href={targetPath}
            onClick={onItemClick}
            data-testid={`admin-nav-item-${item.id}`}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
              isActive
                ? 'bg-brand-gold/15 text-brand-gold font-bold border border-brand-gold/30 shadow-xs'
                : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated/70'
            }`}
          >
            <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand-gold' : 'text-content-muted'}`} />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function getArLabel(id: string): string {
  switch (id) {
    case 'dashboard':
      return 'لوحة المراقبة';
    case 'settings':
      return 'إعدادات المنصة';
    case 'affiliates':
      return 'دليل المسوقين';
    case 'payouts':
      return 'طلبات السحب';
    case 'coprizes':
      return 'جوائز الشركاء (40%)';
    case 'approvals':
      return 'سجل الموافقات والتدقيق';
    case 'draws':
      return 'السحوبات والجوائز';
    case 'awards':
      return 'تذاكر ترويجية إدارية';
    case 'users':
      return 'المستخدمون والصلاحيات';
    case 'audit':
      return 'سجل العمليات والرقابة';
    default:
      return id;
  }
}

function getEnLabel(id: string): string {
  switch (id) {
    case 'dashboard':
      return 'Dashboard';
    case 'settings':
      return 'Platform Settings';
    case 'affiliates':
      return 'Affiliate Oversight';
    case 'payouts':
      return 'Payout Settlements';
    case 'coprizes':
      return 'Co-Prize Adjudication';
    case 'approvals':
      return 'Approvals & Audit';
    case 'draws':
      return 'Draws & Prizes';
    case 'awards':
      return 'Promotional Awards';
    case 'users':
      return 'Users & Capabilities';
    case 'audit':
      return 'Audit Logs';
    default:
      return id;
  }
}
