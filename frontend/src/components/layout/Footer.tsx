'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSiteWideCms } from '@/hooks/admin/useAdminCms';

import { DeveloperAttribution } from '@/components/layout/DeveloperAttribution';

export default function Footer() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const t = useTranslations('footer');
  const { data: cmsData } = useSiteWideCms();
  const siteShell = cmsData?.sections?.site_shell;

  const copyrightText =
    (isAr ? siteShell?.footer_copyright_ar : siteShell?.footer_copyright_en) ||
    t('copyright');

  const disclaimerText =
    (isAr ? siteShell?.footer_disclaimer_ar : siteShell?.footer_disclaimer_en) ||
    t('disclaimer');

  return (
    <footer className="w-full bg-slate-100 dark:bg-[#050b14] border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 py-8 text-center text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-4">
        {/* Developer Attribution: Logo on top, exact brand text at the bottom */}
        <DeveloperAttribution logoSize={80} />

        <div className="w-16 h-px bg-slate-200 dark:bg-slate-800" />

        <div className="space-y-1">
          <p>{copyrightText}</p>
          <p className="text-slate-500 dark:text-slate-500">
            {disclaimerText}
          </p>
        </div>
      </div>
    </footer>
  );
}
