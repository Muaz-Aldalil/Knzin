'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { HeroSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AdminHeroCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent } =
    useAdminCmsSection<HeroSectionContent>('hero');

  const [formData, setFormData] = useState<HeroSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = (field: keyof HeroSectionContent, value: any) => {
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
            {isAr ? 'جارِ تحميل إعدادات البانر...' : 'Loading hero configuration...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'البانر الرئيسي (Hero Section)' : 'Hero Section'}
        description={
          isAr
            ? 'تعديل النصوص والشارات وأزرار التوجيه في أول شاشة يراها الزائر.'
            : 'Configure headlines, badges, call-to-actions, and timer settings for the visitor hero section.'
        }
        icon={Sparkles}
        targetRoute="/#hero"
        isSaving={isUpdating}
        isSaved={isSuccess}
        errorMessage={error?.message}
        onSave={handleSave}
      >
        <div className="space-y-6">
          {/* Badge */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'شارة أعلى العنوان (Badge)' : 'Top Badge Text'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'النص بالعربية' : 'Arabic Text'}
                </label>
                <input
                  type="text"
                  value={formData.badge_ar || ''}
                  onChange={(e) => handleChange('badge_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'النص بالإنجليزية' : 'English Text'}
                </label>
                <input
                  type="text"
                  value={formData.badge_en || ''}
                  onChange={(e) => handleChange('badge_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'العنوان الرئيسي (Main Heading)' : 'Main Heading'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'العنوان بالعربية' : 'Arabic Heading'}
                </label>
                <input
                  type="text"
                  value={formData.heading_ar || ''}
                  onChange={(e) => handleChange('heading_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none font-bold"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'العنوان بالإنجليزية' : 'English Heading'}
                </label>
                <input
                  type="text"
                  value={formData.heading_en || ''}
                  onChange={(e) => handleChange('heading_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none font-bold"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Subheading */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'النص التوضيحي (Subheading)' : 'Subheading Narrative'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الوصف بالعربية' : 'Arabic Subheading'}
                </label>
                <textarea
                  rows={3}
                  value={formData.subheading_ar || ''}
                  onChange={(e) => handleChange('subheading_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none resize-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الوصف بالإنجليزية' : 'English Subheading'}
                </label>
                <textarea
                  rows={3}
                  value={formData.subheading_en || ''}
                  onChange={(e) => handleChange('subheading_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none resize-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'أزرار الدعوة للإجراء (CTA Buttons)' : 'Call To Action Buttons'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الزر الرئيسي (عربي)' : 'Primary CTA Label (AR)'}
                </label>
                <input
                  type="text"
                  value={formData.primary_cta_label_ar || ''}
                  onChange={(e) => handleChange('primary_cta_label_ar', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الزر الرئيسي (إنجليزي)' : 'Primary CTA Label (EN)'}
                </label>
                <input
                  type="text"
                  value={formData.primary_cta_label_en || ''}
                  onChange={(e) => handleChange('primary_cta_label_en', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'رابط الزر الرئيسي' : 'Primary CTA Link/Anchor'}
                </label>
                <input
                  type="text"
                  value={formData.primary_cta_url || ''}
                  onChange={(e) => handleChange('primary_cta_url', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الزر الثانوي (عربي)' : 'Secondary CTA Label (AR)'}
                </label>
                <input
                  type="text"
                  value={formData.secondary_cta_label_ar || ''}
                  onChange={(e) => handleChange('secondary_cta_label_ar', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الزر الثانوي (إنجليزي)' : 'Secondary CTA Label (EN)'}
                </label>
                <input
                  type="text"
                  value={formData.secondary_cta_label_en || ''}
                  onChange={(e) => handleChange('secondary_cta_label_en', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'رابط الزر الثانوي' : 'Secondary CTA Link/Anchor'}
                </label>
                <input
                  type="text"
                  value={formData.secondary_cta_url || ''}
                  onChange={(e) => handleChange('secondary_cta_url', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Timer & Image Settings */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'إعدادات العداد والوسائط' : 'Countdown & Media Settings'}
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="timer_active"
                checked={formData.timer_active}
                onChange={(e) => handleChange('timer_active', e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="timer_active" className="text-sm font-medium text-content-primary cursor-pointer">
                {isAr ? 'تفعيل ظهور بطاقة العداد التنازلي للسحب القادم' : 'Enable Next Draw Countdown Card'}
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'عنوان العداد (عربي)' : 'Timer Card Title (AR)'}
                </label>
                <input
                  type="text"
                  value={formData.timer_title_ar || ''}
                  onChange={(e) => handleChange('timer_title_ar', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'عنوان العداد (إنجليزي)' : 'Timer Card Title (EN)'}
                </label>
                <input
                  type="text"
                  value={formData.timer_title_en || ''}
                  onChange={(e) => handleChange('timer_title_en', e.target.value)}
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
