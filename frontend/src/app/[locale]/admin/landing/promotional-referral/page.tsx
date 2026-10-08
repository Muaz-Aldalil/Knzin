'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { PromotionalReferralSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { Users, Loader2 } from 'lucide-react';

export default function AdminPromotionalReferralCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent } =
    useAdminCmsSection<PromotionalReferralSectionContent>('promotional_referral');

  const [formData, setFormData] = useState<PromotionalReferralSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = (field: keyof PromotionalReferralSectionContent, value: any) => {
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
            {isAr ? 'جارِ تحميل إعدادات برنامج الإحالة...' : 'Loading promotional referral settings...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'برنامج الإحالة والشراكة الترويجي' : 'Promotional Referral Section'}
        description={
          isAr
            ? 'تعديل نصوص وشارات برنامج الشركاء الترويجي (العمولة 25% ومشاركة الجائزة 40%) دون تغيير سياسات المحاسبة الثابتة.'
            : 'Configure public referral marketing presentation, commission highlight badges, and co-prize callouts.'
        }
        icon={Users}
        targetRoute="/#referral"
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
                {isAr ? 'تفعيل أو إخفاء قسم برنامج الإحالة في الواجهة العامة.' : 'Show or hide the promotional referral section on the landing page.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.is_visible}
              onChange={(e) => handleChange('is_visible', e.target.checked)}
              className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          {/* Titles */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'عنوان القسم الرئيسي' : 'Section Title'}
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

          {/* Description */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'النص التوضيحي والتشجيعي' : 'Description Copy'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الوصف بالعربية' : 'Arabic Description'}
                </label>
                <textarea
                  rows={3}
                  value={formData.description_ar || ''}
                  onChange={(e) => handleChange('description_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none resize-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الوصف بالإنجليزية' : 'English Description'}
                </label>
                <textarea
                  rows={3}
                  value={formData.description_en || ''}
                  onChange={(e) => handleChange('description_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none resize-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'شارات المزايا الترويجية' : 'Promotional Highlight Badges'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'شارة العمولة الفورية (عربي)' : 'Commission Badge (AR)'}
                </label>
                <input
                  type="text"
                  value={formData.commission_badge_ar || ''}
                  onChange={(e) => handleChange('commission_badge_ar', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'شارة العمولة الفورية (إنجليزي)' : 'Commission Badge (EN)'}
                </label>
                <input
                  type="text"
                  value={formData.commission_badge_en || ''}
                  onChange={(e) => handleChange('commission_badge_en', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'شارة مشاركة الجائزة (عربي)' : 'Co-Prize Share Badge (AR)'}
                </label>
                <input
                  type="text"
                  value={formData.coprize_badge_ar || ''}
                  onChange={(e) => handleChange('coprize_badge_ar', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'شارة مشاركة الجائزة (إنجليزي)' : 'Co-Prize Share Badge (EN)'}
                </label>
                <input
                  type="text"
                  value={formData.coprize_badge_en || ''}
                  onChange={(e) => handleChange('coprize_badge_en', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* CTA Link */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'زر الانضمام لبرنامج الشركاء' : 'Call to Action'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'نص الزر بالعربية' : 'Button Label (AR)'}
                </label>
                <input
                  type="text"
                  value={formData.cta_label_ar || ''}
                  onChange={(e) => handleChange('cta_label_ar', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'نص الزر بالإنجليزية' : 'Button Label (EN)'}
                </label>
                <input
                  type="text"
                  value={formData.cta_label_en || ''}
                  onChange={(e) => handleChange('cta_label_en', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'رابط التوجيه' : 'Target URL'}
                </label>
                <input
                  type="text"
                  value={formData.cta_url || ''}
                  onChange={(e) => handleChange('cta_url', e.target.value)}
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
