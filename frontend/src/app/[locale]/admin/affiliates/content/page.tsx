'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { AffiliateReferralSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { Globe, Loader2 } from 'lucide-react';

export default function AdminAffiliateContentCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent } =
    useAdminCmsSection<AffiliateReferralSectionContent>('affiliate_referral');

  const [formData, setFormData] = useState<AffiliateReferralSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = (field: keyof AffiliateReferralSectionContent, value: any) => {
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
            {isAr ? 'جارِ تحميل إعدادات محتوى صفحة الشركاء...' : 'Loading affiliate content...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'محتوى صفحة الشركاء والإحالة العامة' : 'Public Affiliate Portal Content'}
        description={
          isAr
            ? 'تعديل نصوص الصفحة الترويجية للمسوقين والشركاء مع الحفاظ الكامل على الحسابات ودفتر الأستاذ غير القابل للتعديل.'
            : 'Configure public partner portal headings and onboarding copy without altering immutable ledger logic.'
        }
        icon={Globe}
        isSaving={isUpdating}
        isSaved={isSuccess}
        errorMessage={error?.message}
        onSave={handleSave}
      >
        <div className="space-y-6">
          {/* Hero Titles */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'العنوان الرئيسي لصفحة الشركاء' : 'Affiliate Portal Main Heading'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'العنوان بالعربية' : 'Arabic Heading'}
                </label>
                <input
                  type="text"
                  value={formData.hero_title_ar || ''}
                  onChange={(e) => handleChange('hero_title_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'العنوان بالإنجليزية' : 'English Heading'}
                </label>
                <input
                  type="text"
                  value={formData.hero_title_en || ''}
                  onChange={(e) => handleChange('hero_title_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Subtitles */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'الوصف الفرعي لصفحة الشركاء' : 'Portal Subtitle'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الوصف بالعربية' : 'Arabic Subtitle'}
                </label>
                <textarea
                  rows={3}
                  value={formData.hero_subtitle_ar || ''}
                  onChange={(e) => handleChange('hero_subtitle_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none resize-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الوصف بالإنجليزية' : 'English Subtitle'}
                </label>
                <textarea
                  rows={3}
                  value={formData.hero_subtitle_en || ''}
                  onChange={(e) => handleChange('hero_subtitle_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none resize-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'شرح خطوات العمل (كيف يعمل البرنامج)' : 'How It Works Steps Presentation'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الخطوات بالعربية' : 'Steps Text (AR)'}
                </label>
                <textarea
                  rows={3}
                  value={formData.how_it_works_ar || ''}
                  onChange={(e) => handleChange('how_it_works_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none resize-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الخطوات بالإنجليزية' : 'Steps Text (EN)'}
                </label>
                <textarea
                  rows={3}
                  value={formData.how_it_works_en || ''}
                  onChange={(e) => handleChange('how_it_works_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none resize-none"
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
