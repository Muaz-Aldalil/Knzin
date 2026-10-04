'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { Scale, FileCheck2 } from 'lucide-react';
import { CANONICAL_LEGAL_SHIELD } from '@/components/checkout/LegalShieldCheckbox';
import { usePublicLandingCms } from '@/hooks/admin/useAdminCms';

interface LegalShieldCmsSectionProps {
  className?: string;
}

export function LegalShieldCmsSection({ className = '' }: LegalShieldCmsSectionProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { data: cmsData } = usePublicLandingCms();
  const legal = cmsData?.sections?.legal_compliance;

  if (legal?.is_visible === false) {
    return null;
  }

  const title = isAr ? 'الإقرار والدرع القانوني الإلزامي (العراق)' : 'Mandatory Legal Shield & Compliance';

  const statement = (isAr ? legal?.legal_statement_ar : legal?.legal_statement_en) ||
    CANONICAL_LEGAL_SHIELD;

  const lawReference = (isAr ? legal?.consumer_protection_law_ar : legal?.consumer_protection_law_en) ||
    (isAr
      ? 'متوافق مع تعليمات وزارة التجارة العراقية وقوانين حماية المستهلك رقم (1) لسنة 2010.'
      : 'Complies with Iraqi Ministry of Trade regulations & Consumer Protection Law No. 1 (2010).');

  return (
    <div className={`p-6 rounded-2xl bg-surface-secondary border border-border-subtle space-y-4 ${className}`}>
      <div className="flex items-center gap-2.5 text-secondary dark:text-white font-extrabold text-sm sm:text-base">
        <Scale className="w-5 h-5 text-primary" />
        <span>{title}</span>
      </div>

      <p className="text-xs sm:text-sm text-content-secondary leading-relaxed bg-surface-primary p-4 rounded-xl border border-border-subtle font-medium">
        « {statement} »
      </p>

      <div className="flex items-center gap-2 text-[11px] text-content-muted">
        <FileCheck2 className="w-4 h-4 text-emerald-500" />
        <span>{lawReference}</span>
      </div>
    </div>
  );
}
