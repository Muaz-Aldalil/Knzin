'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="w-full bg-slate-100 dark:bg-[#050b14] border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 py-6 text-center text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        <p>{t('copyright')}</p>
        <p className="mt-1 text-slate-500">
          {t('disclaimer')}
        </p>
      </div>
    </footer>
  );
}
