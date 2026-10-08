'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { SkillCapitalSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { BookOpen, Loader2 } from 'lucide-react';

export default function AdminSkillCapitalCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent } =
    useAdminCmsSection<SkillCapitalSectionContent>('skill_capital');

  const [formData, setFormData] = useState<SkillCapitalSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = (field: keyof SkillCapitalSectionContent, value: any) => {
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
            {isAr ? 'جارِ تحميل إعدادات القسم...' : 'Loading section content...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'المهارة هي رأس المال الحقيقي' : 'Skill & Capital Narrative'}
        description={
          isAr
            ? 'تعديل عنوان ورسالة المؤسس والاقتباس الإلهامي في واجهة المنصة العامة.'
            : 'Configure founder quote, mission narrative, and author credentials shown on the public landing page.'
        }
        icon={BookOpen}
        targetRoute="/#skills"
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
                {isAr ? 'إظهار أو إخفاء قسم المهارة هي رأس المال لجميع الزوار.' : 'Enable or disable display of this section on the public landing page.'}
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
                  value={formData.title_ar || ''}
                  onChange={(e) => handleChange('title_ar', e.target.value)}
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
                  value={formData.title_en || ''}
                  onChange={(e) => handleChange('title_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Quote / Narrative */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'نص الاقتباس (Founder Quote)' : 'Founder Quote Narrative'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الاقتباس بالعربية' : 'Arabic Quote'}
                </label>
                <textarea
                  rows={4}
                  value={formData.quote_ar || ''}
                  onChange={(e) => handleChange('quote_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none resize-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الاقتباس بالإنجليزية' : 'English Quote'}
                </label>
                <textarea
                  rows={4}
                  value={formData.quote_en || ''}
                  onChange={(e) => handleChange('quote_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none resize-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Author Details */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'بيانات الكاتب / المؤسس' : 'Author & Title Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'اسم الكاتب بالعربية' : 'Author Name (AR)'}
                </label>
                <input
                  type="text"
                  value={formData.author_name_ar || ''}
                  onChange={(e) => handleChange('author_name_ar', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'اسم الكاتب بالإنجليزية' : 'Author Name (EN)'}
                </label>
                <input
                  type="text"
                  value={formData.author_name_en || ''}
                  onChange={(e) => handleChange('author_name_en', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'المسمى الوظيفي بالعربية' : 'Author Title (AR)'}
                </label>
                <input
                  type="text"
                  value={formData.author_title_ar || ''}
                  onChange={(e) => handleChange('author_title_ar', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'المسمى الوظيفي بالإنجليزية' : 'Author Title (EN)'}
                </label>
                <input
                  type="text"
                  value={formData.author_title_en || ''}
                  onChange={(e) => handleChange('author_title_en', e.target.value)}
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
