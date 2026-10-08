'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { FileQuestion, Home, Compass } from 'lucide-react';
import { useSiteWideCms } from '@/hooks/admin/useAdminCms';

export default function LocalizedNotFound() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { data: cmsData } = useSiteWideCms();
  const notices = cmsData?.sections?.system_notices;

  const title =
    (isAr ? notices?.not_found_title_ar : notices?.not_found_title_en) ||
    (isAr ? 'الصفحة غير موجودة (404)' : 'Page Not Found (404)');

  const description =
    (isAr ? notices?.not_found_desc_ar : notices?.not_found_desc_en) ||
    (isAr
      ? 'عذراً، المسار أو المحتوى المهني الذي تبحث عنه غير متاح أو تم نقله.'
      : 'Sorry, the vocational page or resource you are looking for is unavailable.');

  const homeBtn =
    (isAr ? notices?.not_found_home_btn_ar : notices?.not_found_home_btn_en) ||
    (isAr ? 'الرئيسية والدورات' : 'Home & Courses');

  const searchBtn =
    (isAr ? notices?.not_found_search_btn_ar : notices?.not_found_search_btn_en) ||
    (isAr ? 'البحث الذكي' : 'Smart Search');

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
        <FileQuestion className="w-10 h-10" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl sm:text-3xl font-black text-content-primary">
          {title}
        </h1>
        <p className="text-sm text-content-muted leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-md transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>{homeBtn}</span>
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-secondary border border-border-subtle hover:bg-surface-elevated text-content-primary text-sm font-bold transition-colors"
        >
          <Compass className="w-4 h-4" />
          <span>{searchBtn}</span>
        </Link>
      </div>
    </div>
  );
}
