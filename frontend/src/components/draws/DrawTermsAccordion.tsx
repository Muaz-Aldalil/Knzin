'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DrawTier } from '@/types/draws';
import { ChevronDown, ShieldAlert, Sparkles, Clock, Calendar } from 'lucide-react';

interface DrawTermsAccordionProps {
  tier: DrawTier;
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function DrawTermsAccordion({
  tier,
  className = '',
  isOpen: controlledIsOpen,
  onToggle,
}: DrawTermsAccordionProps) {
  const t = useTranslations('draws');
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isExpanded = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <div className={`border-t border-border/60 pt-3 text-start ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {t('termsTitle')}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="mt-2.5 space-y-2 text-xs text-muted-foreground animate-in fade-in-50 duration-200">
          {/* Tier-Specific Rule */}
          <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/40">
            {tier === 'hourly' && (
              <>
                <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">{t('termsHourlyRule')}</p>
              </>
            )}
            {tier === 'daily' && (
              <>
                <Calendar className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{t('termsDailyRule')}</p>
              </>
            )}
            {tier === 'monthly' && (
              <>
                <Sparkles className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{t('termsMonthlyRule')}</p>
              </>
            )}
          </div>

          {/* Canonical Legal Shield Notice */}
          <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 text-foreground/80">
            <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              {t('termsLegalShield')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
