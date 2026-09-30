'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ShieldCheck, Download, Award, Users, FileCheck, HelpCircle } from 'lucide-react';
import { WinnerKycCard } from '@/components/compliance/WinnerKycCard';

export interface FaqAccordionProps {
  className?: string;
  kycSlot?: React.ReactNode;
}

export function FaqAccordion({ className = '', kycSlot }: FaqAccordionProps) {
  const t = useTranslations('faq');
  const renderedKycSlot = kycSlot !== undefined ? kycSlot : <WinnerKycCard variant="embedded" />;

  const categories = [
    {
      id: 'model',
      title: t('categoryModel'),
      icon: ShieldCheck,
      items: [
        {
          id: 'faq-model-1',
          question: t('q_model_1'),
          answer: t('a_model_1'),
        },
        {
          id: 'faq-model-2',
          question: t('q_model_2'),
          answer: t('a_model_2'),
        },
      ],
    },
    {
      id: 'downloads',
      title: t('categoryDownloads'),
      icon: Download,
      items: [
        {
          id: 'faq-downloads-1',
          question: t('q_downloads_1'),
          answer: t('a_downloads_1'),
        },
      ],
    },
    {
      id: 'draws',
      title: t('categoryDraws'),
      icon: Award,
      items: [
        {
          id: 'faq-draws-1',
          question: t('q_draws_1'),
          answer: t('a_draws_1'),
        },
      ],
    },
    {
      id: 'referral',
      title: t('categoryReferral'),
      icon: Users,
      items: [
        {
          id: 'faq-referral-1',
          question: t('q_referral_1'),
          answer: t('a_referral_1'),
        },
      ],
    },
    {
      id: 'kyc',
      title: t('categoryKyc'),
      icon: FileCheck,
      items: [
        {
          id: 'faq-kyc-1',
          question: t('q_kyc_1'),
          answer: t('a_kyc_1'),
        },
      ],
    },
  ];

  const defaultValues = [
    'faq-model-1',
    'faq-downloads-1',
    'faq-draws-1',
    'faq-referral-1',
    'faq-kyc-1',
  ];

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className={`scroll-mt-20 sm:scroll-mt-24 space-y-8 my-16 ${className}`}
    >
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{t('heading')}</span>
        </div>
        <h2
          id="faq-heading"
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content-primary"
        >
          {t('heading')}
        </h2>
        <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
          {t('subheading')}
        </p>
      </div>

      {/* Accordion Categories */}
      <div className="max-w-4xl mx-auto space-y-6">
        <Accordion
          type="multiple"
          defaultValue={defaultValues}
          className="w-full space-y-4"
        >
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <div
                key={category.id}
                className="rounded-2xl border border-border-subtle bg-surface-primary shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Category Header */}
                <div className="flex items-center gap-2.5 px-5 py-3.5 bg-surface-secondary/50 border-b border-border-subtle">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-content-primary">
                    {category.title}
                  </h3>
                </div>

                {/* Category Questions */}
                <div className="divide-y divide-border-subtle/50">
                  {category.items.map((item) => (
                    <AccordionItem
                      key={item.id}
                      value={item.id}
                      className="border-b-0 px-2"
                    >
                      <AccordionTrigger className="text-start py-3.5 px-3 text-sm sm:text-base hover:no-underline">
                        <span>{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-content-secondary text-sm leading-relaxed px-3 pb-4">
                        <bdi className="block">{item.answer}</bdi>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </div>

                {/* Embedded KYC Compliance Highlight */}
                {category.id === 'kyc' && renderedKycSlot && (
                  <div className="p-4 border-t border-border-subtle bg-surface-secondary/30">
                    {renderedKycSlot}
                  </div>
                )}
              </div>
            );
          })}
        </Accordion>
      </div>
    </section>
  );
}
