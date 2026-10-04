'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  getVisibleAdminNavGroups,
  AdminNavGroupItem,
  AdminNavSubItem,
} from '@/lib/admin/nav';
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
  BookOpen,
  Globe,
  ChevronDown,
} from 'lucide-react';

export const ADMIN_NAV_ICONS: Record<string, React.ElementType> = {
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
  BookOpen,
  Globe,
};

interface AdminNavProps {
  capabilities: AdminCapability[];
  onItemClick?: () => void;
}

export function AdminNav({ capabilities, onItemClick }: AdminNavProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const isAr = locale === 'ar';

  const visibleGroups = getVisibleAdminNavGroups(capabilities);

  // Maintain expanded state for expandable groups. Auto-expand if current route is within group.
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of visibleGroups) {
      if (group.subItems && group.subItems.length > 0) {
        const hasActiveChild = group.subItems.some((sub) => {
          const subTarget = `/${locale}${sub.path}`;
          return pathname === subTarget || pathname?.startsWith(`${subTarget}/`);
        });
        if (hasActiveChild) {
          initial[group.id] = true;
        }
      }
    }
    return initial;
  });

  // Automatically expand group whenever navigation reaches one of its subpages
  useEffect(() => {
    for (const group of visibleGroups) {
      if (group.subItems && group.subItems.length > 0) {
        const hasActiveChild = group.subItems.some((sub) => {
          const subTarget = `/${locale}${sub.path}`;
          return pathname === subTarget || pathname?.startsWith(`${subTarget}/`);
        });
        if (hasActiveChild && !expandedGroups[group.id]) {
          setExpandedGroups((prev) => ({ ...prev, [group.id]: true }));
        }
      }
    }
  }, [pathname, locale, visibleGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <nav className="space-y-1.5 px-3 py-4 select-none" data-testid="admin-nav" role="navigation" aria-label="Admin Navigation">
      {visibleGroups.map((group) => {
        const IconComponent = ADMIN_NAV_ICONS[group.icon] || LayoutDashboard;
        const groupLabel = isAr ? group.labelAr : group.labelEn;

        // If standalone item without subitems
        if (!group.subItems || group.subItems.length === 0) {
          const targetPath = `/${locale}${group.path || '/admin'}`;
          const isActive =
            group.path === '/admin'
              ? pathname === targetPath
              : pathname === targetPath || pathname?.startsWith(`${targetPath}/`);

          return (
            <Link
              key={group.id}
              href={targetPath}
              onClick={onItemClick}
              data-testid={`admin-nav-item-${group.id}`}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-brand-gold/15 text-brand-gold font-bold border border-brand-gold/30 shadow-xs'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated/70'
              }`}
            >
              <IconComponent
                className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand-gold' : 'text-content-muted'}`}
                aria-hidden="true"
              />
              <span className="truncate">{groupLabel}</span>
            </Link>
          );
        }

        // Expandable group
        const isExpanded = !!expandedGroups[group.id];
        const hasActiveChild = group.subItems.some((sub) => {
          const subTarget = `/${locale}${sub.path}`;
          return pathname === subTarget || pathname?.startsWith(`${subTarget}/`);
        });

        return (
          <div key={group.id} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={isExpanded}
              aria-controls={`group-children-${group.id}`}
              data-testid={`admin-nav-group-${group.id}`}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer text-start ${
                hasActiveChild
                  ? 'bg-brand-gold/10 text-brand-gold font-semibold border border-brand-gold/20'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <IconComponent
                  className={`w-5 h-5 shrink-0 ${hasActiveChild ? 'text-brand-gold' : 'text-content-muted'}`}
                  aria-hidden="true"
                />
                <span className="truncate">{groupLabel}</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-content-muted transition-transform duration-200 ${
                  isExpanded ? 'rotate-180 text-brand-gold' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {isExpanded && (
              <div
                id={`group-children-${group.id}`}
                className="space-y-1 ps-4 border-s-2 border-border-subtle/60 ms-3 py-0.5"
              >
                {group.subItems.map((sub) => {
                  const subTarget = `/${locale}${sub.path}`;
                  const isSubActive =
                    pathname === subTarget || pathname?.startsWith(`${subTarget}/`);
                  const SubIcon = sub.icon ? ADMIN_NAV_ICONS[sub.icon] || LayoutDashboard : null;
                  const subLabel = isAr ? sub.labelAr : sub.labelEn;

                  return (
                    <Link
                      key={sub.id}
                      href={subTarget}
                      onClick={onItemClick}
                      data-testid={`admin-nav-subitem-${sub.id}`}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                        isSubActive
                          ? 'bg-brand-gold/20 text-brand-gold font-bold border border-brand-gold/30 shadow-2xs'
                          : 'text-content-muted hover:text-content-primary hover:bg-surface-elevated/50'
                      }`}
                    >
                      {SubIcon && (
                        <SubIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSubActive ? 'text-brand-gold' : 'text-content-muted'
                          }`}
                          aria-hidden="true"
                        />
                      )}
                      <span className="truncate">{subLabel}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
