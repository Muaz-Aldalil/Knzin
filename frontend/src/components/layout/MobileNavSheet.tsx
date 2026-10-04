'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useTheme } from '@/components/providers/ThemeProvider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Search,
  User as UserIcon,
  LogIn,
  LogOut,
  Ticket,
  Wallet,
  BookOpen,
  Users,
  Gift,
  Trophy,
  Shield,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';
import { USER_MENU_ITEMS, UserMenuItemId } from '@/lib/user-menu';
import { AdminCapability } from '@/types/admin';

const USER_MENU_ICONS: Record<UserMenuItemId, { icon: React.ElementType; className: string }> = {
  'learning-hub': { icon: UserIcon, className: 'text-primary' },
  referral: { icon: Gift, className: 'text-rose-500' },
  transparency: { icon: Trophy, className: 'text-accent' },
  affiliate: { icon: Users, className: 'text-emerald-500' },
};

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
  isAdmin?: boolean;
  adminCapabilities?: AdminCapability[];
  onLogout: () => void;
  onGoogleLogin: () => void;
  onOpenSearch: () => void;
  onOpenHowItWorks?: () => void;
}

export default function MobileNavSheet({
  open,
  onOpenChange,
  user,
  isAdmin = false,
  adminCapabilities = [],
  onLogout,
  onGoogleLogin,
  onOpenSearch,
  onOpenHowItWorks,
}: MobileNavSheetProps) {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tHowItWorks = useTranslations('howItWorks');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const isRtl = locale === 'ar';

  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const toggleLanguage = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    router.replace(pathname, { locale: nextLocale });
  };

  const close = () => onOpenChange(false);

  const isCoursesActive = pathname === '/' || pathname.startsWith('/courses');
  const isRaffleActive = pathname.startsWith('/raffle');
  const isAffiliateActive = pathname.startsWith('/affiliate');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRtl ? 'right' : 'left'}
        dir={isRtl ? 'rtl' : 'ltr'}
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
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-surface-secondary hover:bg-surface-elevated border border-border-subtle hover:border-border text-content-muted hover:text-content-primary transition-colors text-xs cursor-pointer text-start"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="w-4 h-4 text-content-muted shrink-0" />
              <span className="truncate">{t('searchPlaceholder')}</span>
            </div>
            <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-content-muted bg-surface-primary border border-border-subtle rounded shrink-0">
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
              <span>{t('raffle')}</span>
              {isRaffleActive && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>

            <Link
              href="/affiliate"
              onClick={close}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors ${
                isAffiliateActive
                  ? 'bg-surface-secondary text-primary font-semibold'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>{isRtl ? 'الشركاء والمسوّقين' : 'Affiliate Portal'}</span>
              </div>
              {isAffiliateActive && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>

            <button
              type="button"
              onClick={() => {
                close();
                onOpenHowItWorks?.();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-secondary/60 transition-colors text-start cursor-pointer border border-primary/20 bg-primary/5 mt-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <BookOpen className="w-4 h-4 text-primary shrink-0" />
                <div className="truncate">
                  <span className="font-semibold block text-sm text-content-primary truncate">
                    {tHowItWorks('trigger')}
                  </span>
                  <span className="text-[11px] text-content-muted block truncate">
                    {isRtl ? 'تعرف على آلية الدورات والتذاكر' : 'Understand courses & tickets'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 font-bold shrink-0 ms-2">
                {isRtl ? '3 خطوات' : '3 Steps'}
              </span>
            </button>
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

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={close}
                    data-testid="mobile-admin-dashboard-link"
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-brand-gold/10 border border-brand-gold/25 text-xs font-bold text-brand-gold hover:bg-brand-gold/20 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>{isRtl ? 'لوحة التحكم الإدارية' : 'Admin Dashboard'}</span>
                  </Link>
                )}

                <div
                  className="space-y-0.5"
                  data-testid="mobile-user-menu"
                >
                  {USER_MENU_ITEMS.map((item) => {
                    const { icon: ItemIcon, className } = USER_MENU_ICONS[item.id];
                    return (
                      <Link
                        key={item.id}
                        href={item.href as any}
                        onClick={close}
                        data-testid={`mobile-user-link-${item.id}`}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-secondary/60 transition-colors"
                      >
                        <ItemIcon className={`w-4 h-4 shrink-0 ${className}`} />
                        <span>{isRtl ? item.labelAr : item.labelEn}</span>
                      </Link>
                    );
                  })}
                </div>

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
              <div className="pt-2 space-y-2">
                <Link
                  href="/auth/login"
                  onClick={close}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isRtl ? 'تسجيل الدخول / حساب جديد' : 'Sign In / Register'}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onGoogleLogin();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface-secondary hover:bg-surface-elevated text-xs font-semibold text-content-primary border border-border-subtle transition-colors cursor-pointer"
                >
                  <span>{t('loginWithGoogle')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Preferences (1. Theme toggle, 2. Language toggle directly underneath Theme) */}
        <div className="pt-4 border-t border-border-subtle space-y-2">
          <button
            type="button"
            onClick={toggleTheme}
            data-testid="mobile-sheet-theme-toggle"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border-subtle bg-surface-secondary hover:bg-surface-elevated text-xs font-semibold text-content-primary transition-colors cursor-pointer text-start"
          >
            <div className="flex items-center gap-2.5">
              {isDark ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4 text-blue-500" />}
              <span>{t('theme')}</span>
            </div>
            <span className="text-[11px] text-content-muted font-normal">
              {isDark ? t('themeDark') : t('themeLight')}
            </span>
          </button>
          <button
            type="button"
            onClick={toggleLanguage}
            data-testid="mobile-sheet-language-toggle"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border-subtle bg-surface-secondary hover:bg-surface-elevated text-xs font-semibold text-content-primary transition-colors cursor-pointer text-start"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-primary" />
              <span>{t('language')}</span>
            </div>
            <span className="text-[11px] text-content-muted font-normal">
              {locale === 'ar' ? 'English' : 'العربية'}
            </span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
