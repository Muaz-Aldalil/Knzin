'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { AffiliatePortalSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { Users, Loader2 } from 'lucide-react';

export default function AdminAffiliatePortalCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent, sectionData } =
    useAdminCmsSection<AffiliatePortalSectionContent>('affiliate_portal');

  const [formData, setFormData] = useState<AffiliatePortalSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = <K extends keyof AffiliatePortalSectionContent>(
    field: K,
    value: AffiliatePortalSectionContent[K]
  ) => {
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
          <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
          <p className="text-xs text-content-secondary">
            {isAr ? 'جارِ تحميل إعدادات بوابة الشركاء...' : 'Loading affiliate portal configuration...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'بوابة الشركاء والمسوقين (Affiliate Portal Presentation)' : 'Affiliate Portal Presentation'}
        description={
          isAr
            ? 'تعديل نصوص واجهة تسجيل الدخول للشركاء، رسائل سياسة السحب والحد الأدنى، ونصوص مشاركة الجائزة الكبرى (40%).'
            : 'Configure onboarding hero, withdrawal policy notifications, and 40% co-prize explanation.'
        }
        icon={Users}
        isSaving={isUpdating}
        isSaved={isSuccess}
        errorMessage={error?.message}
        updatedAt={sectionData?.updated_at}
        onSave={handleSave}
      >
        {/* Onboarding Hero */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'واجهة الشركاء غير المسجلين (Unauthenticated Onboarding Hero)' : 'Unauthenticated Onboarding Hero'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان البوابة (عربي)' : 'Onboarding Title (AR)'}
              </label>
              <input
                type="text"
                value={formData.onboarding_title_ar}
                onChange={(e) => handleChange('onboarding_title_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان البوابة (إنجليزي)' : 'Onboarding Title (EN)'}
              </label>
              <input
                type="text"
                value={formData.onboarding_title_en}
                onChange={(e) => handleChange('onboarding_title_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'وصف برنامج الشركاء (عربي)' : 'Description (AR)'}
              </label>
              <textarea
                rows={2}
                value={formData.onboarding_desc_ar}
                onChange={(e) => handleChange('onboarding_desc_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'وصف برنامج الشركاء (إنجليزي)' : 'Description (EN)'}
              </label>
              <textarea
                rows={2}
                value={formData.onboarding_desc_en}
                onChange={(e) => handleChange('onboarding_desc_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>
        </div>

        {/* Withdrawal Policy Notice */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'إشعار سياسة السحب والحد الأدنى (Withdrawal Policy Notice)' : 'Withdrawal Policy Notice'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان السياسة (عربي)' : 'Policy Title (AR)'}
              </label>
              <input
                type="text"
                value={formData.policy_notice_title_ar}
                onChange={(e) => handleChange('policy_notice_title_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان السياسة (إنجليزي)' : 'Policy Title (EN)'}
              </label>
              <input
                type="text"
                value={formData.policy_notice_title_en}
                onChange={(e) => handleChange('policy_notice_title_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'نص توضيح السحب (عربي)' : 'Policy Text (AR)'}
              </label>
              <textarea
                rows={2}
                value={formData.policy_notice_text_ar}
                onChange={(e) => handleChange('policy_notice_text_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'نص توضيح السحب (إنجليزي)' : 'Policy Text (EN)'}
              </label>
              <textarea
                rows={2}
                value={formData.policy_notice_text_en}
                onChange={(e) => handleChange('policy_notice_text_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>
        </div>

        {/* Co-Prize Rules Explanation */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'توضيح مشاركة الجائزة الكبرى 40% (Co-Prize Explanation)' : 'Co-Prize (40%) Explanation'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان مشاركة الجائزة (عربي)' : 'Co-Prize Title (AR)'}
              </label>
              <input
                type="text"
                value={formData.coprize_rules_title_ar}
                onChange={(e) => handleChange('coprize_rules_title_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان مشاركة الجائزة (إنجليزي)' : 'Co-Prize Title (EN)'}
              </label>
              <input
                type="text"
                value={formData.coprize_rules_title_en}
                onChange={(e) => handleChange('coprize_rules_title_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'شرح آلية المكافأة (عربي)' : 'Rules Explanation (AR)'}
              </label>
              <textarea
                rows={2}
                value={formData.coprize_rules_desc_ar}
                onChange={(e) => handleChange('coprize_rules_desc_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'شرح آلية المكافأة (إنجليزي)' : 'Rules Explanation (EN)'}
              </label>
              <textarea
                rows={2}
                value={formData.coprize_rules_desc_en}
                onChange={(e) => handleChange('coprize_rules_desc_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>
        </div>
      </CmsFormLayout>
    </AdminGuard>
  );
}
