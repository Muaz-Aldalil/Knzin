'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';
import {
  Ticket,
  Wallet,
  User as UserIcon,
  LogIn,
  LogOut,
  Search,
  BookOpen,
  Trophy,
  ChevronDown,
  Menu,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { SearchCommandDialog } from '@/components/search/SearchCommandDialog';
import MobileNavSheet from './MobileNavSheet';

interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  authProvider: string;
  avatarUrl?: string | null;
}

export default function HeaderHUD() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.userAgent));
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => setIsSearchOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('knzin:open-search', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('knzin:open-search', handleCustomOpen);
    };
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('knzin_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('knzin_auth_token');
    localStorage.removeItem('knzin_user');
    setUser(null);
    window.location.reload();
  };

  const handleGoogleLogin = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    window.location.href = `${backendUrl}/auth/google/redirect`;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/95 backdrop-blur-sm border-b border-border-subtle text-content-primary transition-colors duration-200">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Desktop Navigation */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-colors">
              <span className="text-white font-bold text-sm tracking-wider">K</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-lg tracking-tight text-content-primary group-hover:text-primary transition-colors">
                كَنزين
              </span>
              <span className="hidden sm:inline text-xs font-medium text-content-muted">
                KNZIN
              </span>
            </div>
          </Link>

          {/* Full Desktop Navigation (Large Screens only: >= 1024px) */}
          <nav className="hidden lg:flex items-center gap-2 text-xs font-medium text-content-secondary">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-md hover:text-content-primary hover:bg-surface-secondary transition-colors"
            >
              {t('courses')}
            </Link>

            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-secondary hover:bg-surface-elevated border border-border-subtle hover:border-border text-content-secondary hover:text-content-primary transition-colors text-xs font-medium group cursor-pointer"
              title={isRtl ? 'البحث الذكي (Ctrl + K)' : 'Smart Search (Ctrl + K)'}
            >
              <Search className="w-3.5 h-3.5 text-content-muted group-hover:text-primary transition-colors" />
              <span>{isRtl ? 'البحث' : 'Search'}</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-content-muted bg-surface-primary border border-border-subtle rounded select-none">
                {isMac ? '⌘' : 'Ctrl'} K
              </kbd>
            </button>

            <Link
              href="/design-system"
              className="px-2.5 py-1 rounded-md text-xs text-content-muted hover:text-content-primary hover:bg-surface-secondary transition-colors"
            >
              {isRtl ? 'نظام التصميم' : 'Design System'}
            </Link>
          </nav>
        </div>

        {/* HUD Counters & User Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile / Tablet search trigger (< 1024px) */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="lg:hidden p-2 rounded-lg bg-surface-secondary hover:bg-surface-elevated border border-border-subtle text-content-secondary hover:text-content-primary transition-colors cursor-pointer"
            aria-label={isRtl ? 'البحث الذكي' : 'Search'}
            title={isRtl ? 'البحث الذكي' : 'Search'}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Ticket Counter HUD */}
          <Link
            href="/raffle"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-secondary text-xs font-medium transition-colors"
            title={isRtl ? 'تذاكر السحب الترويجية المجانية' : 'Promotional Raffle Tickets'}
          >
            <Ticket className="w-3.5 h-3.5 text-accent" />
            <span>0 <span className="hidden sm:inline text-content-muted">{tCommon('ticket')}</span></span>
          </Link>

          {/* Desktop-only: Wallet Balance HUD (>= 1024px) */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-content-secondary text-xs font-medium"
            title={isRtl ? 'رصيد المحفظة' : 'Wallet Balance'}
          >
            <Wallet className="w-3.5 h-3.5 text-content-muted" />
            <span>0 {tCommon('currencyIqd')}</span>
          </div>

          {/* Desktop-only: Language Switcher (>= 1024px) */}
          <div className="hidden lg:flex items-center">
            <LanguageToggle />
          </div>

          {/* Desktop-only: Theme Switcher (>= 1024px) */}
          <div className="hidden lg:flex items-center">
            <ThemeToggle />
          </div>

          {/* Desktop-only: User Profile or Google Sign In (>= 1024px) */}
          <div className="hidden lg:flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-surface-secondary border border-border-subtle text-xs font-semibold text-content-primary hover:bg-surface-elevated transition-colors outline-none focus:ring-1 focus:ring-primary/40">
                  <UserIcon className="w-3.5 h-3.5 text-content-muted" />
                  <span className="max-w-[80px] sm:max-w-[120px] truncate">
                    {user.displayName || user.email}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-content-muted" />
                </DropdownMenuTrigger>

                <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-52">
                  <DropdownMenuLabel>
                    {isRtl ? 'حساب المتدرب' : 'Learner Account'}
                  </DropdownMenuLabel>
                  <div className="px-2.5 pb-2 text-[11px] text-content-muted truncate">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 w-full">
                      <UserIcon className="w-4 h-4 text-primary" />
                      <span>{isRtl ? 'لوحة تدريبي وتذاكري' : 'My Learning & Tickets'}</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/raffle" className="flex items-center gap-2 w-full">
                      <Trophy className="w-4 h-4 text-accent" />
                      <span>{isRtl ? 'سحب الجوائز القانوني' : 'Raffle Transparency'}</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20"
                  >
                    <LogOut className="w-4 h-4 ms-0 me-2" />
                    <span>{t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('loginWithGoogle')}</span>
                <span className="sm:hidden">{t('login')}</span>
              </button>
            )}
          </div>

          {/* Mobile & Tablet Hamburger Menu Trigger (< 1024px) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg bg-surface-secondary hover:bg-surface-elevated border border-border-subtle text-content-secondary hover:text-content-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            aria-label={isRtl ? 'فتح القائمة الرئيسية' : 'Open main navigation menu'}
            title={isRtl ? 'القائمة الرئيسية' : 'Main menu'}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global In-Place Search Command Palette (Ctrl + K) */}
      <SearchCommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />

      {/* Mobile & Tablet Navigation Sheet Drawer */}
      <MobileNavSheet
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
        user={user}
        onLogout={handleLogout}
        onGoogleLogin={handleGoogleLogin}
        onOpenSearch={() => setIsSearchOpen(true)}
      />
    </header>
  );
}
