'use client';

import React, { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg border border-border-subtle bg-surface-secondary animate-pulse" />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center p-2 rounded-lg border border-border-subtle bg-surface-secondary hover:bg-surface-elevated text-content-secondary hover:text-content-primary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer ${className || ''}`}
      aria-label={locale === 'ar' ? 'تبديل المظهر' : 'Toggle theme'}
      title={
        isDark
          ? locale === 'ar'
            ? 'التبديل إلى الوضع الفاتح'
            : 'Switch to light mode'
          : locale === 'ar'
            ? 'التبديل إلى الوضع الداكن'
            : 'Switch to dark mode'
      }
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-accent transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-blue-500 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
