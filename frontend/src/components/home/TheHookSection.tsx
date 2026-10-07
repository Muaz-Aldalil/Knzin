'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Sparkles, Quote, ArrowDown } from 'lucide-react';
import { usePublicLandingCms } from '@/hooks/admin/useAdminCms';

export const TheHookSection: React.FC = () => {
  const t = useTranslations('theHook');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { data: cmsData } = usePublicLandingCms();
  const skillCapital = cmsData?.sections?.skill_capital;

  // Visibility guard
  if (skillCapital?.is_visible === false) {
    return null;
  }

  const title = (isAr ? skillCapital?.title_ar : skillCapital?.title_en) || t('title');
  const quote = (isAr ? skillCapital?.quote_ar : skillCapital?.quote_en) || t('quote');
  const authorName = isAr ? skillCapital?.author_name_ar : skillCapital?.author_name_en;
  const authorTitle = isAr ? skillCapital?.author_title_ar : skillCapital?.author_title_en;

  return (
    <section
      id="vision"
      aria-labelledby="vision-heading"
      className="scroll-mt-20 sm:scroll-mt-24 my-8 sm:my-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full"
    >
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-b from-surface-secondary/90 via-surface/80 to-surface-secondary/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        {/* Ambient Decorative Lighting */}
        <div className="absolute -top-24 -start-24 w-64 h-64 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -end-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 text-primary text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('badge')}</span>
          </div>

          {/* Heading */}
          <h2
            id="vision-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-content-primary tracking-tight"
          >
            {title}
          </h2>

          {/* Canonical Founder Quote */}
          <div className="relative max-w-3xl my-2">
            <Quote className="w-8 h-8 text-primary/30 mx-auto mb-3 opacity-60 rotate-180" />
            <blockquote className="text-base sm:text-lg lg:text-xl font-medium text-content-primary/95 leading-relaxed sm:leading-loose">
              «{quote}»
            </blockquote>
            {authorName && (
              <div className="mt-3 text-center">
                <p className="text-xs font-bold text-content-primary">{authorName}</p>
                {authorTitle && (
                  <p className="text-[11px] text-content-secondary mt-0.5">{authorTitle}</p>
                )}
              </div>
            )}
          </div>

          {/* CTA Link / Exploration Prompt */}
          <div className="pt-2">
            <a
              href="#catalog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-secondary text-content-primary border border-border-subtle hover:border-primary/40 text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow group"
            >
              <span>{t('cta')}</span>
              <ArrowDown className="w-3.5 h-3.5 text-primary group-hover:translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
