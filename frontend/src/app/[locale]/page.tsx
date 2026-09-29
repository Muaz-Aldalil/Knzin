import React from 'react';
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('catalog');

  return (
    <div className="py-6">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <h1 className="text-3xl font-extrabold text-[#0B1E3A] sm:text-4xl tracking-tight">
          {t('heading')}
        </h1>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">
          {t('subheading')}
        </p>
      </div>
    </div>
  );
}
