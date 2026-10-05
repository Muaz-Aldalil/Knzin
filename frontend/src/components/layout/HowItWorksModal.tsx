'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSiteWideCms } from '@/hooks/admin/useAdminCms';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { BookOpen, Ticket, Trophy, ArrowRight, ArrowLeft } from 'lucide-react';

interface HowItWorksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  open,
  onOpenChange,
}) => {
  const t = useTranslations('howItWorks');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const isAr = locale === 'ar';
  const { data: cmsData } = useSiteWideCms();
  const siteShell = cmsData?.sections?.site_shell;

  const defaultStepIcons = [BookOpen, Ticket, Trophy];
  const stepStyles = [
    {
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    },
    {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    },
    {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    },
  ];

  const modalTitle =
    (isAr ? siteShell?.how_it_works_title_ar : siteShell?.how_it_works_title_en) ||
    t('title');

  const modalSubtitle =
    (isAr ? siteShell?.how_it_works_subtitle_ar : siteShell?.how_it_works_subtitle_en) ||
    t('subtitle');

  const steps =
    siteShell?.how_it_works_steps && siteShell.how_it_works_steps.length > 0
      ? siteShell.how_it_works_steps.map((s, idx) => {
          const style = stepStyles[idx % stepStyles.length];
          const Icon = defaultStepIcons[idx % defaultStepIcons.length];
          return {
            step: s.step || idx + 1,
            icon: Icon,
            title: isAr ? s.title_ar : s.title_en,
            desc: isAr ? s.desc_ar : s.desc_en,
            badge: (isAr ? s.badge_ar : s.badge_en) || (isAr ? `خطوة ${idx + 1}` : `Step ${idx + 1}`),
            iconBg: style.iconBg,
            badgeBg: style.badgeBg,
          };
        })
      : [
          {
            step: 1,
            icon: BookOpen,
            title: t('step1_title'),
            desc: t('step1_desc'),
            badge: t('step1_badge'),
            iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          },
          {
            step: 2,
            icon: Ticket,
            title: t('step2_title'),
            desc: t('step2_desc'),
            badge: t('step2_badge'),
            iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          },
          {
            step: 3,
            icon: Trophy,
            title: t('step3_title'),
            desc: t('step3_desc'),
            badge: t('step3_badge'),
            iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          },
        ];

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl bg-surface border-border-subtle p-6 sm:p-8 rounded-2xl shadow-2xl"
        id="how-it-works-dialog"
      >
        <DialogHeader className="space-y-2 text-start">
          <DialogTitle
            id="how-it-works-title"
            className="text-xl sm:text-2xl font-bold text-content-primary flex items-center gap-2"
          >
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <BookOpen className="h-5 w-5" />
            </span>
            {modalTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-content-muted">
            {modalSubtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-border-subtle bg-surface-secondary/40 hover:bg-surface-secondary/70 transition-colors">
                  <div
                    className={`p-3 rounded-xl border flex-shrink-0 flex items-center justify-center ${item.iconBg}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-semibold text-content-primary text-base">
                        {item.title}
                      </h4>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${item.badgeBg}`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-content-muted leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {idx < steps.length - 1 && (
                  <div className="flex justify-center my-1 text-content-muted/40 sm:hidden">
                    <ArrowIcon className="h-4 w-4 rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {t('close')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
