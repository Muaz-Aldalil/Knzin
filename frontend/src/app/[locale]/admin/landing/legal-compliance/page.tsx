'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { LegalComplianceSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function AdminLegalComplianceCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent } =
    useAdminCmsSection<LegalComplianceSectionContent>('legal_compliance');

  const [formData, setFormData] = useState<LegalComplianceSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = (field: keyof LegalComplianceSectionContent, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!formData) return;
    await updateContent(formData);
  };

  if (isLoading || !formData) {
    return (
      <AdminGuard requiredCapability="manage_platform_settings">
        <div className="p-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-content-secondary">
            {isAr ? 'جارِ تحميل إعدادات النصوص القانونية...' : 'Loading legal compliance settings...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'النصوص القانونية والامتثال العراقي' : 'Legal & Iraqi Compliance Statements'}
        description={
          isAr
            ? 'إدارة صياغة إقرارات الشراء وحماية المستهلك العراقي رقم (1) لسنة 2010 وإشعارات التحقق من الهوية (KYC).'
            : 'Configure educational purchase disclosure, Iraqi Consumer Protection Law No. (1) of 2010 citation, and KYC verification notice.'
        }
        icon={ShieldCheck}
        targetRoute="/#legal"
        isSaving={isUpdating}
        isSaved={isSuccess}
        errorMessage={error?.message}
        onSave={handleSave}
      >
        <div className="space-y-6">
          {/* Purchase Legal Disclosure */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'إقرار شراء المحتوى التعليمي والهدية الترويجية' : 'Digital Content Purchase & Sweepstakes Gift Disclosure'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'النص بالعربية' : 'Arabic Legal Statement'}
                </label>
                <textarea
                  rows={4}
                  value={formData.legal_statement_ar || ''}
                  onChange={(e) => handleChange('legal_statement_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none resize-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'النص بالإنجليزية' : 'English Legal Statement'}
                </label>
                <textarea
                  rows={4}
                  value={formData.legal_statement_en || ''}
                  onChange={(e) => handleChange('legal_statement_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none resize-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Consumer Protection Law */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'صيغة قانون حماية المستهلك العراقي' : 'Iraqi Consumer Protection Law Citation'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الصيغة بالعربية' : 'Arabic Law Citation'}
                </label>
                <input
                  type="text"
                  value={formData.consumer_protection_law_ar || ''}
                  onChange={(e) => handleChange('consumer_protection_law_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الصيغة بالإنجليزية' : 'English Law Citation'}
                </label>
                <input
                  type="text"
                  value={formData.consumer_protection_law_en || ''}
                  onChange={(e) => handleChange('consumer_protection_law_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* KYC Notice */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'إشعار التحقق من الهوية للفائزين (KYC)' : 'Winner KYC Identity Notice'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الإشعار بالعربية' : 'Arabic KYC Notice'}
                </label>
                <textarea
                  rows={3}
                  value={formData.kyc_notice_ar || ''}
                  onChange={(e) => handleChange('kyc_notice_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none resize-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الإشعار بالإنجليزية' : 'English KYC Notice'}
                </label>
                <textarea
                  rows={3}
                  value={formData.kyc_notice_en || ''}
                  onChange={(e) => handleChange('kyc_notice_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none resize-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>
      </CmsFormLayout>
    </AdminGuard>
  );
}
