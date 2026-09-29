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
  Sparkles,
  LogIn,
  LogOut,
  Search,
  BookOpen,
  Trophy,
  ChevronDown
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
    <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-border-subtle text-content-primary shadow-xs transition-colors duration-200">
      {/* Live Social Proof Marquee Banner */}
      <div className="bg-primary/10 border-b border-border-subtle text-xs py-1.5 px-4 overflow-hidden whitespace-nowrap transition-colors">
        <div className="flex md:justify-center items-center gap-2 text-primary font-bold tracking-wide animate-marquee md:animate-none hover:[animation-play-state:paused]">
          <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse shrink-0" />
          <span>{t('liveDrawMarquee')}</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform duration-200">
              <span className="text-white font-extrabold text-lg tracking-wider">K</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-content-primary group-hover:text-primary transition-colors">
                كَنزين <span className="hidden sm:inline text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">KNZiN</span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-3 text-sm font-semibold text-content-secondary">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg hover:text-primary hover:bg-surface-secondary transition-colors"
            >
              {t('courses')}
            </Link>

            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-surface-elevated border border-border-subtle hover:border-primary/40 text-content-secondary hover:text-content-primary transition-all text-xs font-semibold group cursor-pointer shadow-xs"
              title={isRtl ? 'البحث الذكي (Ctrl + K)' : 'Smart Search (Ctrl + K)'}
            >
              <Search className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
              <span>{isRtl ? 'البحث الذكي' : 'Search'}</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-content-muted bg-surface-primary border border-border-subtle rounded-md select-none group-hover:border-primary/40 group-hover:text-primary transition-colors">
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
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile search trigger */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 rounded-xl bg-surface-secondary hover:bg-surface-elevated border border-border-subtle text-content-primary transition-colors cursor-pointer"
            aria-label={isRtl ? 'البحث الذكي' : 'Search'}
            title={isRtl ? 'البحث الذكي' : 'Search'}
          >
            <Search className="w-4 h-4 text-primary" />
          </button>
          {/* Ticket Counter HUD (Accent Color) */}
          <Link
            href="/raffle"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/30 text-accent text-xs font-black hover:bg-accent/20 transition-colors"
            title={isRtl ? 'تذاكر السحب الترويجية المجانية' : 'Promotional Raffle Tickets'}
          >
            <Ticket className="w-4 h-4 text-accent" />
            <span>0 <span className="hidden sm:inline">{tCommon('ticket')}</span></span>
          </Link>

          {/* Wallet Balance HUD */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-secondary border border-border-subtle text-content-primary text-xs font-bold"
            title={isRtl ? 'رصيد المحفظة' : 'Wallet Balance'}
          >
            <Wallet className="w-3.5 h-3.5 text-primary" />
            <span>0 {tCommon('currencyIqd')}</span>
          </div>

          {/* Language Switcher */}
          <LanguageToggle />

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* User Profile or Google Sign In using shadcn DropdownMenu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-secondary border border-border-subtle text-xs font-bold text-content-primary hover:bg-surface-elevated transition-colors outline-none focus:ring-2 focus:ring-primary/40">
                <UserIcon className="w-3.5 h-3.5 text-primary" />
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
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black transition-all shadow-md shadow-primary/20 active:scale-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('loginWithGoogle')}</span>
              <span className="sm:hidden">{t('login')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Global In-Place Search Command Palette (Ctrl + K) */}
      <SearchCommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  );
}
