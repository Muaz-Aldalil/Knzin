'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { RaffleArenaSectionContent, FaqItem } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { Trophy, Loader2, Plus, Trash2 } from 'lucide-react';

export default function AdminRaffleArenaCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent, sectionData } =
    useAdminCmsSection<RaffleArenaSectionContent>('raffle_arena');

  const [formData, setFormData] = useState<RaffleArenaSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = <K extends keyof RaffleArenaSectionContent>(
    field: K,
    value: RaffleArenaSectionContent[K]
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
            {isAr ? 'جارِ تحميل إعدادات ساحة السحوبات...' : 'Loading raffle arena configuration...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'ساحة الجوائز والسحوبات الترويجية (Raffle Arena)' : 'Promotional Raffle Arena'}
        description={
          isAr
            ? 'تعديل نصوص الشفافية القانونية، بطاقات المقارنة بين الأجزاء والباقات، والأسئلة الشائعة للسحوبات.'
            : 'Configure legal transparency hero, Part vs Bundle commercial perks, and sweepstakes FAQs.'
        }
        icon={Trophy}
        isSaving={isUpdating}
        isSaved={isSuccess}
        errorMessage={error?.message}
        updatedAt={sectionData?.updated_at}
        onSave={handleSave}
      >
        {/* Transparency Hero */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'بانر الشفافية الرئيسي (Transparency Hero)' : 'Transparency Hero'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'شارة الترخيص (عربي)' : 'License Badge (AR)'}
              </label>
              <input
                type="text"
                value={formData.hero_badge_ar}
                onChange={(e) => handleChange('hero_badge_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'شارة الترخيص (إنجليزي)' : 'License Badge (EN)'}
              </label>
              <input
                type="text"
                value={formData.hero_badge_en}
                onChange={(e) => handleChange('hero_badge_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'العنوان الرئيسي (عربي)' : 'Main Title (AR)'}
              </label>
              <input
                type="text"
                value={formData.hero_title_ar}
                onChange={(e) => handleChange('hero_title_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'العنوان الرئيسي (إنجليزي)' : 'Main Title (EN)'}
              </label>
              <input
                type="text"
                value={formData.hero_title_en}
                onChange={(e) => handleChange('hero_title_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'الوصف التوضيحي (عربي)' : 'Description (AR)'}
              </label>
              <textarea
                rows={3}
                value={formData.hero_description_ar}
                onChange={(e) => handleChange('hero_description_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'الوصف التوضيحي (إنجليزي)' : 'Description (EN)'}
              </label>
              <textarea
                rows={3}
                value={formData.hero_description_en}
                onChange={(e) => handleChange('hero_description_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'تاريخ السحب القادم المجدول (عربي)' : 'Next Draw Date Label (AR)'}
              </label>
              <input
                type="text"
                value={formData.next_draw_date_text_ar}
                onChange={(e) => handleChange('next_draw_date_text_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'تاريخ السحب القادم المجدول (إنجليزي)' : 'Next Draw Date Label (EN)'}
              </label>
              <input
                type="text"
                value={formData.next_draw_date_text_en}
                onChange={(e) => handleChange('next_draw_date_text_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>
        </div>

        {/* Commercial Cards Presentation */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'بطاقات الباقات ومزايا الشراء (Commercial Cards)' : 'Part vs Bundle Perks Presentation'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان باقة الدورة الكاملة (عربي)' : 'Bundle Title (AR)'}
              </label>
              <input
                type="text"
                value={formData.bundle_title_ar}
                onChange={(e) => handleChange('bundle_title_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان باقة الدورة الكاملة (إنجليزي)' : 'Bundle Title (EN)'}
              </label>
              <input
                type="text"
                value={formData.bundle_title_en}
                onChange={(e) => handleChange('bundle_title_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'وصف التوفير بالباقة (عربي)' : 'Bundle Savings Note (AR)'}
              </label>
              <input
                type="text"
                value={formData.bundle_desc_ar}
                onChange={(e) => handleChange('bundle_desc_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'وصف التوفير بالباقة (إنجليزي)' : 'Bundle Savings Note (EN)'}
              </label>
              <input
                type="text"
                value={formData.bundle_desc_en}
                onChange={(e) => handleChange('bundle_desc_en', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-content-primary"
              />
            </div>
          </div>
        </div>
      </CmsFormLayout>
    </AdminGuard>
  );
}
