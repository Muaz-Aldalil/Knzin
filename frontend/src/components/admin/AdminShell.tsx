'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAdminSession } from '@/hooks/admin/useAdminSession';
import { AdminNav } from './AdminNav';
import { Menu, X, Shield, LogOut, Globe, Sparkles } from 'lucide-react';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { user, capabilities } = useAdminSession();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLocale = () => {
    const nextLocale = isAr ? 'en' : 'ar';
    const newPath = window.location.pathname.replace(`/${locale}`, `/${nextLocale}`);
    window.location.href = newPath;
  };

  const handleLogout = () => {
    localStorage.removeItem('knzin_auth_token');
    window.location.href = `/${locale}`;
  };

  return (
    <div className="min-h-screen bg-app-bg text-content-primary flex flex-col md:flex-row" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-surface-card border-e border-border-subtle shrink-0 min-h-screen sticky top-0 h-screen">
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
              className="p-2 rounded-lg text-content-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface-card border-b border-border-subtle sticky top-0 z-30">
        <Link href={`/${locale}/admin`} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-gold flex items-center justify-center text-brand-navy font-bold text-sm">
            K
          </div>
          <span className="font-bold text-content-primary">
            {isAr ? 'لوحة التحكم الإدارية' : 'Admin Panel'}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLocale}
            className="p-2 rounded-lg border border-border-subtle text-content-secondary hover:text-content-primary"
          >
            <Globe className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-surface-elevated text-content-primary"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex">
          <div className="w-72 bg-surface-card h-full flex flex-col p-4 shadow-xl border-e border-border-subtle">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <span className="font-bold text-brand-gold">
                {isAr ? 'قائمة الإدارة' : 'Admin Navigation'}
              </span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5 text-content-muted" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminNav capabilities={capabilities} onItemClick={() => setMobileMenuOpen(false)} />
            </div>
            <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
              <span className="text-xs text-content-secondary truncate">{user?.email}</span>
              <button onClick={handleLogout} className="text-xs text-rose-500 font-bold">
                {isAr ? 'خروج' : 'Logout'}
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Topbar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-surface-card/60 backdrop-blur-md border-b border-border-subtle sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-semibold text-content-secondary">
            <span className="px-2.5 py-1 rounded-md bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
              {isAr ? 'منطقة الرقابة والإدارة' : 'Administrative Operations Zone'}
            </span>
            <span>•</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-elevated transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isAr ? 'English' : 'العربية'}</span>
            </button>
            <Link
              href={`/${locale}`}
              className="px-3 py-1.5 rounded-lg bg-surface-elevated text-xs font-medium text-content-primary hover:bg-surface-elevated/80 transition-colors"
            >
              {isAr ? 'عرض المنصة للجمهور' : 'View Public Site'}
            </Link>
          </div>
        </header>

        {/* Page Inner Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
