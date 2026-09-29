'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import LanguageToggle from './LanguageToggle';
import { Ticket, Wallet, User as UserIcon, Sparkles, LogIn, LogOut } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full bg-[#0B1E3A] border-b border-slate-800 text-white shadow-md">
      {/* Live Social Proof Marquee Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-xs py-1.5 px-4 overflow-hidden border-b border-blue-600/30">
        <div className="flex items-center justify-center gap-2 text-blue-100 font-medium tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse shrink-0" />
          <span>{t('liveDrawMarquee')}</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group focus:outline-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
              <span className="text-white font-extrabold text-lg tracking-wider">K</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-blue-200 transition-colors">
                كَنزين <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/20">KNZiN</span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-300">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              {t('courses')}
            </Link>
          </nav>
        </div>

        {/* HUD Counters & User Controls */}
        <div className="flex items-center gap-3">
          {/* Ticket Counter HUD */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold"
            title="تذاكر السحب الترويجية المجانية"
          >
            <Ticket className="w-4 h-4 text-amber-400" />
            <span>0 {tCommon('ticket')}</span>
          </div>

          {/* Wallet Balance HUD */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-semibold"
            title="رصيد المحفظة"
          >
            <Wallet className="w-3.5 h-3.5 text-blue-400" />
            <span>0 {tCommon('currencyIqd')}</span>
          </div>

          {/* Language Switcher */}
          <LanguageToggle />

          {/* User Profile or Google Sign In */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="max-w-[120px] truncate">{user.displayName || user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title={t('logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1877F2] hover:bg-blue-600 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/20 active:scale-95"
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
