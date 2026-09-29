'use client';

import React, { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/80 animate-pulse" />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 group cursor-pointer"
      aria-label={locale === 'ar' ? 'تبديل المظهر الداكن/الفاتح' : 'Toggle dark/light theme'}
      title={
        isDark
          ? locale === 'ar' ? 'التبديل إلى الوضع الفاتح' : 'Switch to light mode'
          : locale === 'ar' ? 'التبديل إلى الوضع الداكن' : 'Switch to dark mode'
      }
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 text-accent transition-transform duration-200 group-hover:rotate-45" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-blue-300 transition-transform duration-200 group-hover:-rotate-12" />
      )}
      <span className="hidden sm:inline">
        {isDark
          ? locale === 'ar' ? 'فاتح' : 'Light'
          : locale === 'ar' ? 'داكن' : 'Dark'}
      </span>
    </button>
  );
}
