'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { LessonPlayerSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { PlayCircle, Loader2 } from 'lucide-react';

export default function AdminLessonPlayerCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent, sectionData } =
    useAdminCmsSection<LessonPlayerSectionContent>('lesson_player');

  const [formData, setFormData] = useState<LessonPlayerSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = <K extends keyof LessonPlayerSectionContent>(
    field: K,
    value: LessonPlayerSectionContent[K]
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
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-content-secondary">
            {isAr ? 'جارِ تحميل إعدادات مشغل الدروس...' : 'Loading lesson player configuration...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'مشغل الدروس والحجب (Lesson Player & Paywall Overlay)' : 'Lesson Player & Paywall Overlay'}
        description={
          isAr
            ? 'تعديل نصوص الحجب والاشتراك المعروضة فوق الفيديو المغلق، وبانر الاحتفال بإتمام الدرس.'
            : 'Configure paywall pay-to-unlock overlay copy, perks list, and completion celebration banner.'
        }
        icon={PlayCircle}
        targetRoute="/courses/craft-auto-body-repair-pro/learn"
        isSaving={isUpdating}
        isSaved={isSuccess}
        errorMessage={error?.message}
        updatedAt={sectionData?.updated_at}
        onSave={handleSave}
      >
        {/* Paywall Locked Overlay */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h2 className="text-base font-bold text-content-primary">
              {isAr ? 'واجهة الحجب والاشتراك (Paywall Locked Overlay)' : 'Paywall Locked Overlay'}
            </h2>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-content-primary">
              <input
                type="checkbox"
                checked={formData.is_visible}
                onChange={(e) => handleChange('is_visible', e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span>{isAr ? 'تفعيل العرض' : 'Visible'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان الحجب الرئيسي (عربي)' : 'Paywall Headline (AR)'}
              </label>
              <input
                type="text"
                value={formData.paywall_headline_ar}
                onChange={(e) => handleChange('paywall_headline_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان الحجب الرئيسي (إنجليزي)' : 'Paywall Headline (EN)'}
              </label>
              <input
                type="text"
                value={formData.paywall_headline_en}
                onChange={(e) => handleChange('paywall_headline_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'العنوان الفرعي ودعوة الشراء (عربي)' : 'Subheadline (AR)'}
              </label>
              <textarea
                rows={2}
                value={formData.paywall_subheadline_ar}
                onChange={(e) => handleChange('paywall_subheadline_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'العنوان الفرعي ودعوة الشراء (إنجليزي)' : 'Subheadline (EN)'}
              </label>
              <textarea
                rows={2}
                value={formData.paywall_subheadline_en}
                onChange={(e) => handleChange('paywall_subheadline_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'نص زر الشراء (عربي)' : 'CTA Button Label (AR)'}
              </label>
              <input
                type="text"
                value={formData.paywall_cta_label_ar}
                onChange={(e) => handleChange('paywall_cta_label_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'نص زر الشراء (إنجليزي)' : 'CTA Button Label (EN)'}
              </label>
              <input
                type="text"
                value={formData.paywall_cta_label_en}
                onChange={(e) => handleChange('paywall_cta_label_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>
        </div>

        {/* Completion Celebration Banner */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'بانر التهنئة بإتمام الدرس (Completion Celebration)' : 'Completion Celebration Banner'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان التهنئة (عربي)' : 'Celebration Title (AR)'}
              </label>
              <input
                type="text"
                value={formData.completion_banner_title_ar}
                onChange={(e) => handleChange('completion_banner_title_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان التهنئة (إنجليزي)' : 'Celebration Title (EN)'}
              </label>
              <input
                type="text"
                value={formData.completion_banner_title_en}
                onChange={(e) => handleChange('completion_banner_title_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>
        </div>
      </CmsFormLayout>
    </AdminGuard>
  );
}
