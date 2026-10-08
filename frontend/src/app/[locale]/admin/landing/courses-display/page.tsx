'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { CoursesDisplaySectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { BookOpen, Loader2 } from 'lucide-react';

export default function AdminCoursesDisplayCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent } =
    useAdminCmsSection<CoursesDisplaySectionContent>('courses_display');

  const [formData, setFormData] = useState<CoursesDisplaySectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = (field: keyof CoursesDisplaySectionContent, value: any) => {
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
            {isAr ? 'جارِ تحميل إعدادات العرض...' : 'Loading display configuration...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'عرض الدورات والمناهج التدريبية' : 'Courses Display & Curricula'}
        description={
          isAr
            ? 'التحكم في عنوان ووصف قسم الدورات وشارة خصم الباقة الكاملة دون التأثير على حقوق المشتركين المسجلين.'
            : 'Configure public course grid headings and bundle savings badge without impacting learner entitlements.'
        }
        icon={BookOpen}
        targetRoute="/#catalog"
        isSaving={isUpdating}
        isSaved={isSuccess}
        errorMessage={error?.message}
        onSave={handleSave}
      >
        <div className="space-y-6">
          {/* Visibility toggle */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-content-primary">
                {isAr ? 'ظهور القسم في الصفحة الرئيسية' : 'Section Visibility'}
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                {isAr ? 'إظهار شبكة الدورات والمناهج في الواجهة العامة.' : 'Show or hide the course catalog section on the public landing page.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.is_visible}
              onChange={(e) => handleChange('is_visible', e.target.checked)}
              className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          {/* Section Titles */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'عنوان القسم (Section Title)' : 'Section Title'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'العنوان بالعربية' : 'Arabic Title'}
                </label>
                <input
                  type="text"
                  value={formData.section_title_ar || ''}
                  onChange={(e) => handleChange('section_title_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'العنوان بالإنجليزية' : 'English Title'}
                </label>
                <input
                  type="text"
                  value={formData.section_title_en || ''}
                  onChange={(e) => handleChange('section_title_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Section Subtitle */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'الوصف الفرعي (Section Subtitle)' : 'Section Subtitle'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الوصف بالعربية' : 'Arabic Subtitle'}
                </label>
                <input
                  type="text"
                  value={formData.section_subtitle_ar || ''}
                  onChange={(e) => handleChange('section_subtitle_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الوصف بالإنجليزية' : 'English Subtitle'}
                </label>
                <input
                  type="text"
                  value={formData.section_subtitle_en || ''}
                  onChange={(e) => handleChange('section_subtitle_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Bundle Badge Configuration */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-content-primary">
                  {isAr ? 'شارة توفير الباقة الكاملة' : 'Complete Bundle Savings Badge'}
                </h3>
                <p className="text-xs text-content-secondary mt-0.5">
                  {isAr ? 'عرض شارة ترويجية مميزة توضح وفر الشراء الكامل والتذاكر الإضافية.' : 'Display savings incentive badge on complete course package.'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.show_bundle_discount_badge}
                onChange={(e) => handleChange('show_bundle_discount_badge', e.target.checked)}
                className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'نص الشارة بالعربية' : 'Badge Text (AR)'}
                </label>
                <input
                  type="text"
                  value={formData.bundle_badge_text_ar || ''}
                  onChange={(e) => handleChange('bundle_badge_text_ar', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'نص الشارة بالإنجليزية' : 'Badge Text (EN)'}
                </label>
                <input
                  type="text"
                  value={formData.bundle_badge_text_en || ''}
                  onChange={(e) => handleChange('bundle_badge_text_en', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
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
