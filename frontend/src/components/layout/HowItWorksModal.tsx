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
import { BookOpen, Ticket, Trophy } from 'lucide-react';

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
  const isAr = locale === 'ar';
  const { data: cmsData } = useSiteWideCms();
  const siteShell = cmsData?.sections?.site_shell;

  const defaultStepIcons = [BookOpen, Ticket, Trophy];
  const stepStyles = [
    {
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      badgeTextColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      badgeTextColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badgeTextColor: 'text-amber-600 dark:text-amber-400',
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
            badgeTextColor: style.badgeTextColor,
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
            badgeTextColor: 'text-blue-600 dark:text-blue-400',
          },
          {
            step: 2,
            icon: Ticket,
            title: t('step2_title'),
            desc: t('step2_desc'),
            badge: t('step2_badge'),
            iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            badgeTextColor: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            step: 3,
            icon: Trophy,
            title: t('step3_title'),
            desc: t('step3_desc'),
            badge: t('step3_badge'),
            iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            badgeTextColor: 'text-amber-600 dark:text-amber-400',
          },
        ];

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
            <BookOpen className="hidden sm:inline-flex h-6 w-6 text-primary shrink-0" />
            {modalTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-content-muted">
            {modalSubtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-border-subtle bg-surface-secondary/40 hover:bg-surface-secondary/70 transition-colors">
                  <div
                    className={`hidden sm:flex shrink-0 items-center justify-center ${item.badgeTextColor}`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-semibold text-content-primary text-base">
                        {item.title}
                      </h4>
                      <span className={`text-xs font-bold ${item.badgeTextColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-content-muted leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
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
