'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAdminSession } from '@/hooks/admin/useAdminSession';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/providers/ThemeProvider';
import { AdminNav } from './AdminNav';
import { HowItWorksModal } from '@/components/layout/HowItWorksModal';
import { AdminSessionTimeoutModal } from './AdminSessionTimeoutModal';
import { DraftRestoreBanner } from './DraftRestoreBanner';
import { saveCurrentPageDraft } from '@/lib/admin/draft-preservation';
import { AdminFeedbackProvider } from './AdminFeedbackContext';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  X,
  Shield,
  LogOut,
  Globe,
  Sparkles,
  Eye,
  ExternalLink,
  Sun,
  Moon,
  HelpCircle,
  ChevronDown,
  LayoutDashboard,
  Settings,
} from 'lucide-react';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {

  const {
    user,
    capabilities,
    remainingSeconds,
    isWarning,
    isExpired,
    extendSession,
    isExtending,
  } = useAdminSession();
  const { logout } = useAuth();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Session expiration handler: Auto-save client draft, clear session, and cleanly redirect to login
  useEffect(() => {
    if (!isExpired) return;

    if (typeof window !== 'undefined') {
      saveCurrentPageDraft(window.location.pathname);
      void logout().then(() => {
        const redirectUrl = `/${locale}/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        window.location.href = redirectUrl;
      });
    }
  }, [isExpired, locale, logout]);

  const tNav = useTranslations('nav');
  const tHowItWorks = useTranslations('howItWorks');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 16;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open to prevent underlying page from scrolling
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileMenuOpen]);

  // Escape key dismisses mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const toggleLocale = () => {
    const nextLocale = isAr ? 'en' : 'ar';
    const newPath = window.location.pathname.replace(`/${locale}`, `/${nextLocale}`);
    window.location.href = newPath;
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = `/${locale}`;
  };

  const renderAdminDropdownContent = () => (
    <DropdownMenuContent align={isAr ? 'start' : 'end'} className="w-64">
      {/* 1. Theme toggle */}
      <DropdownMenuItem
        onClick={toggleTheme}
        data-testid="admin-dropdown-theme"
        className="flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {isDark ? (
            <Sun className="w-4 h-4 text-accent" />
          ) : (
            <Moon className="w-4 h-4 text-blue-500" />
          )}
          <span>{tNav('theme')}</span>
        </div>
        <span className="text-[11px] text-content-muted font-normal">
          {isDark ? tNav('themeDark') : tNav('themeLight')}
        </span>
      </DropdownMenuItem>

      {/* 2. Language toggle directly underneath Theme */}
      <DropdownMenuItem
        onClick={toggleLocale}
        data-testid="admin-dropdown-language"
        className="flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <span>{tNav('language')}</span>
        </div>
        <span className="text-[11px] text-content-muted font-normal">
          {isAr ? 'English' : 'العربية'}
        </span>
      </DropdownMenuItem>

      {/* 3. How It Works directly underneath Language */}
      <DropdownMenuItem
        onClick={() => setIsHowItWorksOpen(true)}
        data-testid="admin-dropdown-how-it-works"
        className="flex items-center gap-2 cursor-pointer"
      >
        <HelpCircle className="w-4 h-4 text-primary" />
        <span>{tHowItWorks('trigger')}</span>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      {/* 4. Existing Admin account/profile actions */}
      <DropdownMenuLabel>
        {isAr ? 'حساب المشرف' : 'Administrator Account'}
      </DropdownMenuLabel>
      <div className="px-2.5 pb-2 text-[11px] text-content-muted truncate">
        {user?.display_name && (
          <span className="font-semibold block text-content-primary truncate">
            {user.display_name}
          </span>
        )}
        <span className="truncate block">{user?.email}</span>
        <div className="flex items-center gap-1.5 mt-1 text-brand-gold font-medium">
          <Shield className="w-3.5 h-3.5 text-brand-gold shrink-0" />
          <span>
            {capabilities.length} {isAr ? 'صلاحيات مفعلة' : 'Active Capabilities'}
          </span>
        </div>
      </div>

      <DropdownMenuItem asChild>
        <Link
          href={`/${locale}/admin`}
          data-testid="admin-dropdown-dashboard"
          className="flex items-center gap-2 w-full cursor-pointer text-xs"
        >
          <LayoutDashboard className="w-4 h-4 text-brand-gold" />
          <span>{isAr ? 'لوحة التحكم الإدارية' : 'Admin Dashboard'}</span>
        </Link>
      </DropdownMenuItem>

      {capabilities.includes('manage_platform_settings') && (
        <DropdownMenuItem asChild>
          <Link
            href={`/${locale}/admin/settings`}
            className="flex items-center gap-2 w-full cursor-pointer text-xs"
          >
            <Settings className="w-4 h-4 text-content-muted" />
            <span>{isAr ? 'إعدادات المنصة' : 'Platform Settings'}</span>
          </Link>
        </DropdownMenuItem>
      )}

      <DropdownMenuSeparator />

      {/* View Platform action in Dropdown */}
      <DropdownMenuItem asChild>
        <Link
          href={`/${locale}`}
          data-testid="admin-dropdown-view-platform"
          className="flex items-center justify-between w-full font-semibold text-primary cursor-pointer text-xs"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <span>{isAr ? 'عرض المنصة للجمهور' : 'View Platform'}</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-content-muted" />
        </Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      {/* Sign Out action in Dropdown */}
      <DropdownMenuItem
        onClick={handleLogout}
        data-testid="admin-dropdown-logout"
        className="text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/20 cursor-pointer flex items-center gap-2 text-xs"
      >
        <LogOut className="w-4 h-4" />
        <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  return (
    <AdminFeedbackProvider>
      <div className="min-h-screen bg-app-bg text-content-primary flex flex-col md:flex-row scroll-pt-16 md:scroll-pt-20" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-surface border-e border-border-subtle shrink-0 sticky top-0 h-screen z-20">
        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
          <Link href={`/${locale}/admin`} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold to-brand-gold-dark flex items-center justify-center text-brand-navy shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-content-primary block leading-tight">
                {isAr ? 'كَنزين الإدارة' : 'KNZiN Admin'}
              </span>
              <span className="text-xs text-brand-gold font-medium">
                {isAr ? 'لوحة العمليات والرقابة' : 'Back-Office Portal'}
              </span>
            </div>
          </Link>
        </div>

        {/* View Platform Shortcut in Sidebar */}
        <div className="px-4 py-3 border-b border-border-subtle bg-surface-elevated/20">
          <Link
            href={`/${locale}`}
            data-testid="admin-sidebar-view-platform"
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface-elevated hover:bg-surface border border-border-subtle text-xs font-semibold text-content-primary hover:text-brand-gold transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-gold" />
              <span>{isAr ? 'عرض المنصة للجمهور' : 'View Platform'}</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-content-muted group-hover:text-brand-gold transition-colors" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AdminNav capabilities={capabilities} />
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-border-subtle bg-surface-elevated/40">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-content-primary truncate">
                {user?.display_name || user?.email}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                <span className="text-xs text-content-secondary truncate">
                  {capabilities.length} {isAr ? 'صلاحيات مفعلة' : 'Capabilities'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title={isAr ? 'تسجيل الخروج' : 'Sign Out'}
              data-testid="admin-sidebar-logout"
              className="p-2 rounded-lg text-content-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div
        className={`md:hidden flex items-center justify-between p-4 sticky top-0 z-30 border-b motion-safe:transition-all motion-safe:duration-200 motion-reduce:transition-none ${
          isScrolled
            ? 'bg-surface/95 backdrop-blur-md border-border-subtle shadow-xs'
            : 'bg-surface border-border-subtle'
        }`}
      >
        <Link href={`/${locale}/admin`} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-gold flex items-center justify-center text-brand-navy font-bold text-sm">
            K
          </div>
          <span className="font-bold text-content-primary">
            {isAr ? 'لوحة التحكم الإدارية' : 'Admin Panel'}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}`}
            data-testid="admin-mobile-header-view-platform"
            title={isAr ? 'عرض المنصة للجمهور' : 'View Platform'}
            className="p-2 rounded-lg border border-border-subtle text-brand-gold hover:bg-surface-elevated transition-colors"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              data-testid="admin-mobile-profile-trigger"
              className="p-2 rounded-lg border border-border-subtle text-content-secondary hover:text-content-primary cursor-pointer"
              aria-label={isAr ? 'خيارات المشرف' : 'Admin options'}
            >
              <Shield className="w-4 h-4 text-brand-gold" />
            </DropdownMenuTrigger>
            {renderAdminDropdownContent()}
          </DropdownMenu>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-surface-elevated text-content-primary cursor-pointer"
            aria-label={isAr ? 'فتح قائمة التنقل' : 'Toggle navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 bg-surface text-content-primary h-full flex flex-col p-4 shadow-2xl border-e border-border-subtle relative z-10"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <span className="font-bold text-brand-gold">
                {isAr ? 'قائمة الإدارة' : 'Admin Navigation'}
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-elevated transition-colors cursor-pointer"
                aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* View Platform in Mobile Drawer */}
            <div className="py-3 border-b border-border-subtle">
              <Link
                href={`/${locale}`}
                onClick={() => setMobileMenuOpen(false)}
                data-testid="admin-drawer-view-platform"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-brand-gold/10 border border-brand-gold/30 text-xs font-bold text-brand-gold hover:bg-brand-gold/20 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>{isAr ? 'عرض المنصة للجمهور' : 'View Platform'}</span>
              </Link>
            </div>

            {/* Mobile Drawer Controls: 1. Theme, 2. Language directly underneath, 3. How It Works */}
            <div className="py-3 border-b border-border-subtle space-y-2">
              <button
                type="button"
                onClick={toggleTheme}
                data-testid="admin-drawer-theme"
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border-subtle bg-surface-elevated hover:bg-surface text-xs font-semibold text-content-primary transition-colors cursor-pointer text-start"
              >
                <div className="flex items-center gap-2">
                  {isDark ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4 text-blue-500" />}
                  <span>{tNav('theme')}</span>
                </div>
                <span className="text-[11px] text-content-muted font-normal">
                  {isDark ? tNav('themeDark') : tNav('themeLight')}
                </span>
              </button>
              <button
                type="button"
                onClick={toggleLocale}
                data-testid="admin-drawer-language"
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border-subtle bg-surface-elevated hover:bg-surface text-xs font-semibold text-content-primary transition-colors cursor-pointer text-start"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <span>{tNav('language')}</span>
                </div>
                <span className="text-[11px] text-content-muted font-normal">
                  {isAr ? 'English' : 'العربية'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsHowItWorksOpen(true);
                }}
                data-testid="admin-drawer-how-it-works"
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-xs font-semibold text-content-primary transition-colors cursor-pointer text-start"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <span>{tHowItWorks('trigger')}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                  {isAr ? 'دليل كَنزين' : 'Guide'}
                </span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-2">
              <AdminNav capabilities={capabilities} onItemClick={() => setMobileMenuOpen(false)} />
            </div>

            <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
              <span className="text-xs text-content-secondary truncate">{user?.email}</span>
              <button
                onClick={handleLogout}
                data-testid="admin-drawer-logout"
                className="text-xs text-rose-500 font-bold hover:underline cursor-pointer"
              >
                {isAr ? 'تسجيل الخروج' : 'Sign Out'}
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Topbar / Navbar */}
        <header
          className={`hidden md:flex items-center justify-between px-8 py-4 sticky top-0 z-30 border-b motion-safe:transition-all motion-safe:duration-200 motion-reduce:transition-none ${
            isScrolled
              ? 'bg-surface/95 backdrop-blur-md border-border-subtle shadow-xs'
              : 'bg-surface border-border-subtle'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-content-secondary">
            <span className="px-2.5 py-1 rounded-md bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
              {isAr ? 'منطقة الرقابة والإدارة' : 'Administrative Operations Zone'}
            </span>
            <span>•</span>
            <span>{user?.email}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Platform Shortcut */}
            <Link
              href={`/${locale}`}
              data-testid="admin-topbar-view-platform"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/30 text-xs font-bold text-brand-gold transition-colors"
              title={isAr ? 'عرض المنصة للجمهور' : 'View Platform'}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isAr ? 'عرض المنصة للجمهور' : 'View Platform'}</span>
            </Link>

            {/* Admin Profile & Preferences Dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                data-testid="admin-topbar-profile-trigger"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-elevated/70 hover:bg-surface-elevated border border-border-subtle text-xs font-semibold text-content-primary transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-brand-gold/40"
              >
                <div className="w-5 h-5 rounded-md bg-brand-gold/20 flex items-center justify-center text-brand-gold font-bold">
                  <Shield className="w-3 h-3 text-brand-gold" />
                </div>
                <span className="max-w-[200px] sm:max-w-[240px] truncate">
                  {user?.display_name || user?.email || (isAr ? 'المشرف' : 'Admin')}
                </span>
                <ChevronDown className="w-3 h-3 text-content-muted" />
              </DropdownMenuTrigger>
              {renderAdminDropdownContent()}
            </DropdownMenu>

            {/* Quick 1-click Sign Out Button */}
            <button
              onClick={handleLogout}
              data-testid="admin-topbar-logout"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title={isAr ? 'تسجيل الخروج' : 'Sign Out'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
            </button>
          </div>
        </header>

        {/* Page Inner Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <DraftRestoreBanner />
          {children}
        </main>
      </div>

      {/* How It Works Dialog Modal for Admin Shell */}
      <HowItWorksModal
        open={isHowItWorksOpen}
        onOpenChange={setIsHowItWorksOpen}
      />

      {/* 1-Minute Warning Countdown Modal for Admin Session */}
      <AdminSessionTimeoutModal
        isOpen={isWarning}
        remainingSeconds={remainingSeconds}
        onExtend={async () => {
          await extendSession();
        }}
        onSignOut={handleLogout}
        isExtending={isExtending}
      />
    </div>
    </AdminFeedbackProvider>
  );
}
