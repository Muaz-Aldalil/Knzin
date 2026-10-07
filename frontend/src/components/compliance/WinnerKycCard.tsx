'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Scale, FileText, CheckCircle2 } from 'lucide-react';

export interface WinnerKycCardProps {
  variant?: 'standalone' | 'embedded';
  className?: string;
}

export function WinnerKycCard({ variant = 'standalone', className = '' }: WinnerKycCardProps) {
  const t = useTranslations('kyc');

  const isEmbedded = variant === 'embedded';

  return (
    <div
      role="region"
      aria-label={t('title')}
      className={`rounded-2xl border transition-all duration-200 ${
        isEmbedded
          ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 p-4'
          : 'bg-gradient-to-br from-surface-primary to-surface-secondary/70 border-border-subtle shadow-md p-6 sm:p-8'
      } ${className}`}
    >
      <div className="space-y-4">
        {/* Header with Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('badge')}</span>
          </div>

          <div className="inline-flex items-center gap-1 text-xs text-content-muted">
            <Scale className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">{t('lawCitation')}</span>
          </div>
        </div>

        {/* Headline */}
        <div>
          <h3
            className={`font-extrabold text-content-primary tracking-tight ${
              isEmbedded ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
            }`}
          >
            {t('title')}
          </h3>
        </div>

        {/* Verbatim Legal Clause Box */}
        <div className="p-4 rounded-xl bg-surface-primary/80 border border-amber-500/20 shadow-xs">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <bdi className="text-xs sm:text-sm font-semibold text-content-primary leading-relaxed">
              {t('clause')}
            </bdi>
          </div>
        </div>

        {/* Transparency Footnote */}
        <div className="flex items-center gap-2 text-xs text-content-secondary">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{t('notice')}</span>
        </div>
      </div>
    </div>
  );
}
