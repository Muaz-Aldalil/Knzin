'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { PlayCircle, Clock, Ticket, Lock, BookOpen } from 'lucide-react';
import { CheckoutItemData } from '@/components/checkout/CheckoutBottomSheet';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface CoursePartData {
  id: string;
  part_number: number;
  title_ar: string;
  title_en: string;
  syllabus_ar: string;
  syllabus_en: string;
  part_price_cents: number;
  part_promotional_tickets: number;
  display_price_label: string;
  resource_types: string[];
  duration_minutes: number;
  is_free?: boolean;
}

interface CoursePartListProps {
  courseId: string;
  courseTitle: string;
  courseSlug?: string;
  parts: CoursePartData[];
  onSelectPart: (item: CheckoutItemData) => void;
  isCourseEnrolled?: boolean;
}

export default function CoursePartList({
  courseId,
  courseTitle,
  courseSlug,
  parts,
  onSelectPart,
  isCourseEnrolled = false,
}: CoursePartListProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const t = useTranslations('catalog');
  const tCommon = useTranslations('common');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div>
          <h3 className="text-lg font-black text-content-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>{t('partsTitle')}</span>
          </h3>
          <p className="text-xs text-content-secondary mt-0.5">
            {isRtl
              ? 'مخطط المنهاج المهني العملي مقسم لأجزاء تدريبية مركزة'
              : 'Practical vocational curriculum divided into focused modular parts'}
          </p>
        </div>
        <span className="text-xs text-content-muted font-bold">
          {parts.length} {isRtl ? 'أجزاء تدريبية' : 'Training Parts'}
        </span>
      </div>

      {/* Vertex-style Timeline Curriculum with shadcn Accordion */}
      <div className="relative rounded-2xl border border-border-subtle bg-surface shadow-sm overflow-hidden divide-y divide-border-subtle">
        <Accordion type="multiple" defaultValue={['part-1']} className="w-full">
          {parts.map((part, index) => {
            const partTitle = isRtl ? part.title_ar : part.title_en;
            const syllabus = isRtl ? part.syllabus_ar : part.syllabus_en;
            const isFirstFree = part.is_free !== undefined ? part.is_free : (part.part_number === 1);
            const isPartAccessible = isCourseEnrolled || isFirstFree;
            const lessonHref = `/lessons/${courseSlug || 'course'}?part=${part.part_number}`;
            const isLast = index === parts.length - 1;

            return (
              <AccordionItem
                key={part.id}
                value={`part-${part.part_number}`}
                className="border-b border-border-subtle last:border-b-0 hover:bg-surface-secondary/20 transition-colors"
              >
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Timeline Node & Title */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Node circle with vertical connector line */}
                    <div className="relative flex flex-col items-center shrink-0">
                      <span
                        className={`flex size-9 items-center justify-center rounded-xl text-xs font-black shadow-sm ${
                          isPartAccessible
                            ? 'bg-success text-white shadow-success/20'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}
                      >
                        {part.part_number}
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPartAccessible ? (
                          <Badge variant="success" size="sm" className="font-semibold text-[11px]">
                            <span>{isCourseEnrolled ? (isRtl ? 'متاح للمشاهدة' : 'Unlocked') : (isRtl ? 'معاينة مجانية' : 'Free Preview')}</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" size="sm" icon={<Lock className="w-3 h-3 text-content-muted shrink-0" />} className="font-medium text-[11px]">
                            <span>{isRtl ? `الجزء ${part.part_number}` : `Part ${part.part_number}`}</span>
                          </Badge>
                        )}

                        <span className="flex items-center gap-1 text-[11px] font-mono text-content-muted">
                          <Clock className="w-3 h-3" />
                          <span>{part.duration_minutes} {isRtl ? 'دقيقة' : 'min'}</span>
                        </span>

                        {!isFirstFree && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-accent">
                            <Ticket className="w-3 h-3" />
                            <span>{part.part_promotional_tickets} {isRtl ? 'تذكرة سحب' : 'Ticket'}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-content-primary leading-snug">
                        {partTitle}
                      </h4>
                    </div>
                  </div>

                  {/* Right: Actions & Pricing */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border-subtle">
                    {isPartAccessible ? (
                      <Link
                        href={lessonHref}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>{isRtl ? 'مشاهدة الدرس' : 'Watch Lesson'}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="text-start md:text-end">
                          <bdi className="text-sm sm:text-base font-bold text-content-primary block">
                            ${(part.part_price_cents / 100).toFixed(2)}
                          </bdi>
                          <bdi className="text-[11px] text-content-muted font-mono block">
                            {part.display_price_label}
                          </bdi>
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            onSelectPart({
                              courseId,
                              courseTitle,
                              itemType: 'part',
                              partId: part.id,
                              partNumber: part.part_number,
                              partTitle,
                              priceCents: part.part_price_cents,
                              promotionalTickets: part.part_promotional_tickets,
                              displayPriceLabel: part.display_price_label,
                            })
                          }
                          className="font-medium text-xs rounded-lg"
                        >
                          {isRtl ? 'فتح الجزء' : 'Unlock Part'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collapsible Syllabus Details via Accordion */}
                <AccordionTrigger className="px-5 py-2 text-xs font-semibold text-content-secondary hover:text-content-primary hover:bg-transparent">
                  <span>{isRtl ? 'تفاصيل المحاور والمهارات المشروحة' : 'View Syllabus Breakdown'}</span>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4 text-xs sm:text-sm text-content-secondary leading-relaxed bg-surface-secondary/30 rounded-xl mx-4 mb-3 border border-border-subtle/50">
                  <p className="font-medium pt-2">{syllabus}</p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-content-muted">
                    <span className="font-bold">{isRtl ? 'الملحقات المتوفرة:' : 'Included:'}</span>
                    <span className="px-2 py-0.5 rounded bg-surface border border-border-subtle">
                      {isRtl ? 'فيديو تدريبي عالي الدقة' : 'HD Video Lecture'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface border border-border-subtle">
                      {isRtl ? 'قائمة الفحص والسلامة' : 'Safety Checklist'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface border border-border-subtle">
                      {isRtl ? 'مخططات ورش العمل' : 'Schematic Diagrams'}
                    </span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
