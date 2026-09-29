'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
}

export default function LanguageToggle({ className }: LanguageToggleProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-secondary hover:bg-surface-elevated text-content-primary text-xs font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer ${className || ''}`}
      aria-label={locale === 'ar' ? 'تغيير اللغة' : 'Change language'}
      title={locale === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
    >
      <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="hidden sm:inline">{locale === 'ar' ? 'English' : 'العربية'}</span>
      <span className="sm:hidden">{locale === 'ar' ? 'EN' : 'ع'}</span>
    </button>
  );
}
