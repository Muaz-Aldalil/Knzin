'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      aria-label="Toggle Language"
    >
      <Globe className="w-3.5 h-3.5 text-blue-400" />
      <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
}
