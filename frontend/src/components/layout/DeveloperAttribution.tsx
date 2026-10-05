'use client';

import React from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';

interface DeveloperAttributionProps {
  className?: string;
  logoSize?: number;
}

export function DeveloperAttribution({ className = '', logoSize = 64 }: DeveloperAttributionProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const currentYear = new Date().getFullYear();
  const arabicYear = currentYear.toLocaleString('ar-IQ', { useGrouping: false });

  const companyUrl = 'https://digagesolutions.com/';

  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
      {/* Logo Link (individual link, not wrapping whole box) */}
      <a
        href={companyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block rounded-2xl transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#00bcd4]/50"
        aria-label={isAr ? 'ديجتال أيج للحلول التقنية' : 'DigAge for Tech Solutions'}
      >
        <Image
          src="/digage-logo.png"
          alt={isAr ? 'ديجتال أيج للحلول التقنية' : 'DigAge for Tech Solutions'}
          width={logoSize}
          height={logoSize}
          className="object-contain drop-shadow-sm"
          style={{ width: `${logoSize}px`, height: `${logoSize}px` }}
        />
      </a>

      {/* Text Link (individual link, not wrapping whole box) */}
      <a
        href={companyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs sm:text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-200 hover:opacity-90 hover:underline decoration-[#00bcd4]/40 underline-offset-4 transition-all focus:outline-none focus:ring-2 focus:ring-[#00bcd4]/50 rounded-sm"
      >
        {isAr ? (
          <span className="inline-flex items-center gap-1.5" dir="rtl">
            <span>© {arabicYear}</span>
            <span style={{ color: '#00bcd4' }}>ديجتال</span>
            <span style={{ color: '#e91e63' }}>أيج</span>
            <span>للحلول التقنية</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5" dir="ltr">
            <span>© {currentYear}</span>
            <span className="font-extrabold tracking-tight">
              <span style={{ color: '#00bcd4' }}>Dig</span>
              <span style={{ color: '#e91e63' }}>Age</span>
            </span>
            <span>for Tech Solutions</span>
          </span>
        )}
      </a>
    </div>
  );
}

export default DeveloperAttribution;
