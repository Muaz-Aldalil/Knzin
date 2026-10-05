'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { CourseDetailSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { BookOpen, Loader2 } from 'lucide-react';

export default function AdminCourseDetailCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent, sectionData } =
    useAdminCmsSection<CourseDetailSectionContent>('course_detail');

  const [formData, setFormData] = useState<CourseDetailSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = <K extends keyof CourseDetailSectionContent>(
    field: K,
    value: CourseDetailSectionContent[K]
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
            {isAr ? 'جارِ تحميل إعدادات صفحة الدورة...' : 'Loading course detail configuration...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'صفحة تفاصيل الدورة (Course Details Presentation)' : 'Course Details Presentation'}
        description={
          isAr
            ? 'التحكم في بانر الضمان المهني، ترويج الباقات الكاملة، وعناوين مخرجات التعلم المعروضة في صفحة الدورة.'
            : 'Configure vocational guarantee banners, bundle savings callouts, and learning outcomes presentation.'
        }
        icon={BookOpen}
        isSaving={isUpdating}
        isSaved={isSuccess}
        errorMessage={error?.message}
        updatedAt={sectionData?.updated_at}
        onSave={handleSave}
      >
        {/* Vocational Guarantee Banner */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h2 className="text-base font-bold text-content-primary">
              {isAr ? 'بانر الضمان المهني والاعتماد (Vocational Guarantee Banner)' : 'Vocational Guarantee Banner'}
            </h2>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-content-primary">
              <input
                type="checkbox"
                checked={formData.is_visible}
                onChange={(e) => handleChange('is_visible', e.target.checked)}
                className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold"
              />
              <span>{isAr ? 'تفعيل البانر' : 'Visible'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'شارة الضمان (عربي)' : 'Badge Label (AR)'}
              </label>
              <input
                type="text"
                value={formData.guarantee_badge_ar}
                onChange={(e) => handleChange('guarantee_badge_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'شارة الضمان (إنجليزي)' : 'Badge Label (EN)'}
              </label>
              <input
                type="text"
                value={formData.guarantee_badge_en}
                onChange={(e) => handleChange('guarantee_badge_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'العنوان الرئيسي للضمان (عربي)' : 'Guarantee Headline (AR)'}
              </label>
              <input
                type="text"
                value={formData.guarantee_headline_ar}
                onChange={(e) => handleChange('guarantee_headline_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'العنوان الرئيسي للضمان (إنجليزي)' : 'Guarantee Headline (EN)'}
              </label>
              <input
                type="text"
                value={formData.guarantee_headline_en}
                onChange={(e) => handleChange('guarantee_headline_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'نص الضمان التوضيحي (عربي)' : 'Guarantee Description (AR)'}
              </label>
              <textarea
                rows={2}
                value={formData.guarantee_description_ar}
                onChange={(e) => handleChange('guarantee_description_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'نص الضمان التوضيحي (إنجليزي)' : 'Guarantee Description (EN)'}
              </label>
              <textarea
                rows={2}
                value={formData.guarantee_description_en}
                onChange={(e) => handleChange('guarantee_description_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>
        </div>

        {/* Bundle Promo Callout */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'ترويج الباقة الكاملة (Bundle Promo Callout)' : 'Bundle Promo Callout'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان الباقة الترويجي (عربي)' : 'Bundle Promo Title (AR)'}
              </label>
              <input
                type="text"
                value={formData.bundle_promo_title_ar}
                onChange={(e) => handleChange('bundle_promo_title_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان الباقة الترويجي (إنجليزي)' : 'Bundle Promo Title (EN)'}
              </label>
              <input
                type="text"
                value={formData.bundle_promo_title_en}
                onChange={(e) => handleChange('bundle_promo_title_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>
        </div>
      </CmsFormLayout>
    </AdminGuard>
  );
}
