'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';
import { Ticket, Wallet, User as UserIcon, Sparkles, LogIn, LogOut, Search } from 'lucide-react';

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
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Check if token and user data are cached in localStorage
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
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#070e1b]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white shadow-xs transition-colors duration-200">
      {/* Live Social Proof Marquee Banner */}
      <div className="bg-primary-light/80 dark:bg-slate-900 border-b border-primary/20 dark:border-primary/20 text-xs py-1.5 px-4 overflow-hidden whitespace-nowrap transition-colors">
        <div className="flex md:justify-center items-center gap-2 text-blue-900 dark:text-blue-100 font-bold tracking-wide animate-marquee md:animate-none hover:[animation-play-state:paused]">
          <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse shrink-0" />
          <span>{t('liveDrawMarquee')}</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 group focus:outline-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform duration-200">
              <span className="text-white font-extrabold text-lg tracking-wider">K</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-secondary dark:text-white group-hover:text-primary transition-colors">
                كَنزين <span className="hidden sm:inline text-xs font-bold px-1.5 py-0.5 rounded bg-primary-light dark:bg-primary/20 text-primary dark:text-blue-300 border border-primary/20 dark:border-primary/30">KNZiN</span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg hover:text-primary dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              {t('courses')}
            </Link>

            <Link
              href="/search"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-primary-hover dark:hover:text-white hover:bg-primary-light/60 dark:hover:bg-slate-800/60 transition-colors text-primary dark:text-blue-300"
            >
              <Search className="w-3.5 h-3.5 text-primary" />
              <span>{locale === 'ar' ? 'البحث الذكي' : 'Search'}</span>
            </Link>

            <Link
              href="/design-system"
              className="px-2.5 py-1 rounded-md text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors"
            >
              {locale === 'ar' ? 'نظام التصميم' : 'Design System'}
            </Link>
          </nav>
        </div>

        {/* HUD Counters & User Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Ticket Counter HUD (Accent Color) */}
          <div
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-accent/10 border border-amber-300/80 dark:border-accent/30 text-amber-900 dark:text-accent text-xs font-black"
            title="تذاكر السحب الترويجية المجانية"
          >
            <Ticket className="w-4 h-4 text-accent" />
            <span>0 <span className="hidden sm:inline">{tCommon('ticket')}</span></span>
          </div>

          {/* Wallet Balance HUD */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold"
            title="رصيد المحفظة"
          >
            <Wallet className="w-3.5 h-3.5 text-primary" />
            <span>0 {tCommon('currencyIqd')}</span>
          </div>

          {/* Language Switcher */}
          <LanguageToggle />

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* User Profile or Google Sign In */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-300">
                <UserIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="max-w-[70px] sm:max-w-[120px] truncate">{user.displayName || user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={t('logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md shadow-primary/20 active:scale-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('loginWithGoogle')}</span>
              <span className="sm:hidden">{t('login')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
