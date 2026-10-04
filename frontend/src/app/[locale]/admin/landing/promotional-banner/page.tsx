'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { PromotionalBannerSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { Gift, Loader2 } from 'lucide-react';

export default function AdminPromotionalBannerCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent } =
    useAdminCmsSection<PromotionalBannerSectionContent>('promotional_banner');

  const [formData, setFormData] = useState<PromotionalBannerSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = (field: keyof PromotionalBannerSectionContent, value: any) => {
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
            {isAr ? 'جارِ تحميل إعدادات البانر الترويجي...' : 'Loading promotional banner content...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'البانر الترويجي للجائزة الكبرى' : 'Promotional Grand Prize Banner'}
        description={
          isAr
            ? 'تعديل عنوان وتفاصيل البانر الترويجي المخصص للجائزة الكبرى والسيارة وروابط التسجيل.'
            : 'Configure grand prize banner headline, subheadline, promotional details, and action URLs.'
        }
        icon={Gift}
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
                {isAr ? 'ظهور البانر في الصفحة الرئيسية' : 'Banner Visibility'}
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                {isAr ? 'تفعيل أو تعطيل ظهور البانر الترويجي للجائزة الكبرى.' : 'Enable or disable display of the promotional banner on the public landing page.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.is_visible}
              onChange={(e) => handleChange('is_visible', e.target.checked)}
              className="w-5 h-5 rounded text-brand-gold focus:ring-brand-gold cursor-pointer"
            />
          </div>

          {/* Headlines */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'عنوان البانر الرئيسي' : 'Banner Headline'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'العنوان بالعربية' : 'Arabic Headline'}
                </label>
                <input
                  type="text"
                  value={formData.headline_ar || ''}
                  onChange={(e) => handleChange('headline_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'العنوان بالإنجليزية' : 'English Headline'}
                </label>
                <input
                  type="text"
                  value={formData.headline_en || ''}
                  onChange={(e) => handleChange('headline_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Subheadlines */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'الوصف الترويجي الفرعي' : 'Promotional Subheadline'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الوصف بالعربية' : 'Arabic Subheadline'}
                </label>
                <textarea
                  rows={3}
                  value={formData.subheadline_ar || ''}
                  onChange={(e) => handleChange('subheadline_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none resize-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الوصف بالإنجليزية' : 'English Subheadline'}
                </label>
                <textarea
                  rows={3}
                  value={formData.subheadline_en || ''}
                  onChange={(e) => handleChange('subheadline_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none resize-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* CTA & Media */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'زر الإجراء ورابط البانر' : 'CTA Button & Action URL'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'نص الزر بالعربية' : 'CTA Label (AR)'}
                </label>
                <input
                  type="text"
                  value={formData.cta_label_ar || ''}
                  onChange={(e) => handleChange('cta_label_ar', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'نص الزر بالإنجليزية' : 'CTA Label (EN)'}
                </label>
                <input
                  type="text"
                  value={formData.cta_label_en || ''}
                  onChange={(e) => handleChange('cta_label_en', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'رابط التوجيه' : 'Target URL/Anchor'}
                </label>
                <input
                  type="text"
                  value={formData.cta_url || ''}
                  onChange={(e) => handleChange('cta_url', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none"
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
