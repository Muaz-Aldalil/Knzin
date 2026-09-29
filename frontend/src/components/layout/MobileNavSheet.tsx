'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';
import {
  Search,
  User as UserIcon,
  LogIn,
  LogOut,
  Ticket,
  Wallet,
} from 'lucide-react';

interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  authProvider: string;
  avatarUrl?: string | null;
}

interface MobileNavSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUser | null;
  onLogout: () => void;
  onGoogleLogin: () => void;
  onOpenSearch: () => void;
}

export default function MobileNavSheet({
  open,
  onOpenChange,
  user,
  onLogout,
  onGoogleLogin,
  onOpenSearch,
}: MobileNavSheetProps) {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const isRtl = locale === 'ar';

  const close = () => onOpenChange(false);

  const isCoursesActive = pathname === '/' || pathname.startsWith('/courses');
  const isRaffleActive = pathname.startsWith('/raffle');
  const isDesignSystemActive = pathname.startsWith('/design-system');
  const isProfileActive = pathname.startsWith('/profile');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRtl ? 'right' : 'left'}
        className="w-[85vw] sm:max-w-sm flex flex-col justify-between p-6 bg-surface border-border-subtle"
      >
        <div className="space-y-6">
          {/* Sheet Header */}
          <SheetHeader className="text-start">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs">
                K
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-base text-content-primary">كَنزين</span>
                <span className="text-[11px] font-medium text-content-muted">KNZIN</span>
              </div>
            </SheetTitle>
            <SheetDescription className="sr-only">
              {isRtl ? 'قائمة التنقل الرئيسية للأجهزة اللوحية والهواتف' : 'Main navigation menu for mobile and tablet'}
            </SheetDescription>
          </SheetHeader>

          {/* Quick Search Trigger */}
          <button
            type="button"
            onClick={() => {
              close();
              onOpenSearch();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-surface-secondary hover:bg-surface-elevated border border-border-subtle hover:border-border text-content-muted hover:text-content-primary transition-colors text-xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-content-muted" />
              <span>{isRtl ? 'البحث في المهارات أو الأدوات...' : 'Search skills or tools...'}</span>
            </div>
            <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-content-muted bg-surface-primary border border-border-subtle rounded">
              Ctrl K
            </kbd>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1 text-sm font-medium">
            <Link
              href="/"
              onClick={close}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors ${
                isCoursesActive
                  ? 'bg-surface-secondary text-primary font-semibold'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary/60'
              }`}
            >
              <span>{t('courses')}</span>
              {isCoursesActive && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>

            <Link
              href="/raffle"
              onClick={close}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors ${
                isRaffleActive
                  ? 'bg-surface-secondary text-primary font-semibold'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary/60'
              }`}
            >
              <span>{isRtl ? 'الجوائز والسحوبات الترويجية' : 'Promotional Raffles'}</span>
              {isRaffleActive && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>

            <Link
              href="/design-system"
              onClick={close}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors ${
                isDesignSystemActive
                  ? 'bg-surface-secondary text-primary font-semibold'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary/60'
              }`}
            >
              <span>{isRtl ? 'نظام التصميم' : 'Design System'}</span>
              {isDesignSystemActive && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          </nav>

          {/* Learner Account & Balances Section */}
          <div className="pt-4 border-t border-border-subtle space-y-3">
            <div className="text-[11px] font-semibold text-content-muted uppercase tracking-wider">
              {isRtl ? 'المحفظة والتذاكر' : 'Wallet & Tickets'}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/raffle"
                onClick={close}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-secondary hover:bg-surface-elevated border border-border-subtle transition-colors"
              >
                <Ticket className="w-4 h-4 text-accent shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-content-primary block">0</span>
                  <span className="text-[10px] text-content-muted">{tCommon('tickets')}</span>
                </div>
              </Link>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-secondary border border-border-subtle">
                <Wallet className="w-4 h-4 text-content-muted shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-content-primary block">0</span>
                  <span className="text-[10px] text-content-muted">{tCommon('currencyIqd')}</span>
                </div>
              </div>
            </div>

            {user ? (
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-secondary/50">
                  <UserIcon className="w-4 h-4 text-content-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-content-primary truncate">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-[11px] text-content-muted truncate">{user.email}</p>
                  </div>
                </div>

                <Link
                  href="/profile"
                  onClick={close}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isProfileActive
                      ? 'bg-surface-secondary text-primary font-semibold'
                      : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary/60'
                  }`}
                >
                  <span>{isRtl ? 'لوحة تدريبي وتذاكري' : 'My Learning & Tickets'}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    close();
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-start cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onGoogleLogin();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('loginWithGoogle')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Preferences (Theme & Language) */}
        <div className="pt-4 border-t border-border-subtle flex items-center justify-between gap-3">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
