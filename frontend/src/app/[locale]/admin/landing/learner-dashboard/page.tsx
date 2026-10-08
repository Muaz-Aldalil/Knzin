'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { LearnerDashboardSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { LayoutDashboard, Loader2 } from 'lucide-react';

export default function AdminLearnerDashboardCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent, sectionData } =
    useAdminCmsSection<LearnerDashboardSectionContent>('learner_dashboard');

  const [formData, setFormData] = useState<LearnerDashboardSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = <K extends keyof LearnerDashboardSectionContent>(
    field: K,
    value: LearnerDashboardSectionContent[K]
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
            {isAr ? 'جارِ تحميل إعدادات لوحة المتدرب...' : 'Loading learner dashboard configuration...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'لوحة المتدرب الشخصية (Learner Dashboard Presentation)' : 'Learner Dashboard Presentation'}
        description={
          isAr
            ? 'التحكم في رسالة الترحيب والتحفيز، وحالة الحساب الفارغ للمتدرب الذي لم يشترك بعد.'
            : 'Configure welcome greeting, motivational quotes, and empty enrolled courses states.'
        }
        icon={LayoutDashboard}
        targetRoute="/dashboard"
        isSaving={isUpdating}
        isSaved={isSuccess}
        errorMessage={error?.message}
        updatedAt={sectionData?.updated_at}
        onSave={handleSave}
      >
        {/* Welcome Hero */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'رسالة الترحيب والتحفيز (Welcome Hero)' : 'Welcome Hero'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان الترحيب (عربي)' : 'Welcome Title (AR)'}
              </label>
              <input
                type="text"
                value={formData.welcome_title_ar}
                onChange={(e) => handleChange('welcome_title_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان الترحيب (إنجليزي)' : 'Welcome Title (EN)'}
              </label>
              <input
                type="text"
                value={formData.welcome_title_en}
                onChange={(e) => handleChange('welcome_title_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'العبارة التحفيزية (عربي)' : 'Motivational Subtitle (AR)'}
              </label>
              <textarea
                rows={2}
                value={formData.welcome_subtitle_ar}
                onChange={(e) => handleChange('welcome_subtitle_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'العبارة التحفيزية (إنجليزي)' : 'Motivational Subtitle (EN)'}
              </label>
              <textarea
                rows={2}
                value={formData.welcome_subtitle_en}
                onChange={(e) => handleChange('welcome_subtitle_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>
        </div>

        {/* Empty State Presentation */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'حالة عدم وجود دورات مشتركة (Empty State Presentation)' : 'Empty State Presentation'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان الحالة الفارغة (عربي)' : 'Empty Headline (AR)'}
              </label>
              <input
                type="text"
                value={formData.empty_headline_ar}
                onChange={(e) => handleChange('empty_headline_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان الحالة الفارغة (إنجليزي)' : 'Empty Headline (EN)'}
              </label>
              <input
                type="text"
                value={formData.empty_headline_en}
                onChange={(e) => handleChange('empty_headline_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'نص الحث على البدء (عربي)' : 'Encouragement Text (AR)'}
              </label>
              <textarea
                rows={2}
                value={formData.empty_desc_ar}
                onChange={(e) => handleChange('empty_desc_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'نص الحث على البدء (إنجليزي)' : 'Encouragement Text (EN)'}
              </label>
              <textarea
                rows={2}
                value={formData.empty_desc_en}
                onChange={(e) => handleChange('empty_desc_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'نص زر تصفح الدورات (عربي)' : 'Catalog CTA Button (AR)'}
              </label>
              <input
                type="text"
                value={formData.empty_cta_label_ar}
                onChange={(e) => handleChange('empty_cta_label_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'نص زر تصفح الدورات (إنجليزي)' : 'Catalog CTA Button (EN)'}
              </label>
              <input
                type="text"
                value={formData.empty_cta_label_en}
                onChange={(e) => handleChange('empty_cta_label_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>
        </div>
      </CmsFormLayout>
    </AdminGuard>
  );
}
