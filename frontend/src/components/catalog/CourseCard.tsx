'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Ticket } from 'lucide-react';
import { CheckoutItemData } from '@/components/checkout/CheckoutBottomSheet';

export interface CourseData {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  cover_image_url: string;
  bundle_price_cents: number;
  bundle_promotional_tickets: number;
  display_price_label: string;
  parts_count: number;
}

interface CourseCardProps {
  course: CourseData;
  onQuickCheckout?: (item: CheckoutItemData) => void;
}

export default function CourseCard({ course, onQuickCheckout }: CourseCardProps) {
  const locale = useLocale();
  const t = useTranslations('catalog');
  const tCommon = useTranslations('common');

  const title = locale === 'ar' ? course.title_ar : course.title_en;
  const description = locale === 'ar' ? course.description_ar : course.description_en;

  const handleBundleClick = (e: React.MouseEvent) => {
    if (onQuickCheckout) {
      e.preventDefault();
      onQuickCheckout({
        courseId: course.id,
        courseTitle: title,
        itemType: 'bundle',
        priceCents: course.bundle_price_cents,
        promotionalTickets: course.bundle_promotional_tickets,
        displayPriceLabel: course.display_price_label,
      });
    }
  };

  return (
    <div className="group flex flex-col bg-surface-primary border border-border-subtle hover:border-border rounded-xl p-5 transition-colors">
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata Row */}
          <div className="flex items-center justify-between gap-2 mb-2 text-xs">
            <span className="text-content-muted font-medium">
              {course.parts_count || 6} {locale === 'ar' ? 'أجزاء تدريبية' : 'parts'}
            </span>

            <span className="text-accent font-medium flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5" />
              <span>{course.bundle_promotional_tickets} {tCommon('ticket')}</span>
            </span>
          </div>

          {/* Title */}
          <h2 className="text-base font-bold text-content-primary leading-snug group-hover:text-primary transition-colors">
            <Link href={`/courses/${course.slug}`}>{title}</Link>
          </h2>

          {/* Description */}
          <p className="mt-2 text-xs text-content-secondary line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Pricing & Actions Section */}
        <div className="mt-5 pt-3.5 border-t border-border-subtle space-y-3">
          {/* Price Tag Row */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-content-muted font-normal block">
                {t('bundleOffer')}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-content-primary">
                  ${(course.bundle_price_cents / 100).toFixed(2)}
                </span>
                <span className="text-xs text-content-muted font-medium">
                  ({course.display_price_label})
                </span>
              </div>
            </div>

            <div className="text-start sm:text-end text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              {t('bundleValueNote')}
            </div>
          </div>

          {/* Dual Action Buttons */}
          <div className="flex flex-col sm:grid sm:grid-cols-2 lg:flex-col xl:grid xl:grid-cols-2 gap-2 pt-0.5">
            <Link
              href={`/courses/${course.slug}`}
              className="w-full py-2 px-3 rounded-lg border border-border-subtle hover:border-border hover:bg-surface-secondary text-content-secondary hover:text-content-primary text-xs font-medium text-center transition-colors"
            >
              {locale === 'ar' ? 'الأجزاء (2$)' : 'Parts ($2)'}
            </Link>

            <button
              onClick={handleBundleClick}
              className="w-full py-2 px-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {t('buyBundle')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
