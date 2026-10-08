'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { FreeReferralCardSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { Gift, Loader2 } from 'lucide-react';

export default function AdminFreeReferralCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent } =
    useAdminCmsSection<FreeReferralCardSectionContent>('free_referral_card');

  const [formData, setFormData] = useState<FreeReferralCardSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = (field: keyof FreeReferralCardSectionContent, value: any) => {
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
            {isAr ? 'جارِ تحميل إعدادات بطاقة الإحالة المجانية...' : 'Loading free referral card...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'بطاقة التذكرة الترويجية المجانية' : 'Free Referral Reward Card'}
        description={
          isAr
            ? 'تعديل نصوص ورسائل الحصول على تذكرة سحب مجانية عند دعوة 3 أصدقاء للتسجيل.'
            : 'Configure promotional copy for free sweepstakes ticket incentives on referring friends.'
        }
        icon={Gift}
        targetRoute="/#referral-card"
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
                {isAr ? 'ظهور البطاقة في الواجهة' : 'Card Visibility'}
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                {isAr ? 'تفعيل أو إخفاء بطاقة المكافأة المجانية للمستخدمين.' : 'Show or hide the free reward card component.'}
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
              {isAr ? 'عنوان البطاقة الرئيسي' : 'Card Title'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'العنوان بالعربية' : 'Arabic Title'}
                </label>
                <input
                  type="text"
                  value={formData.card_title_ar || ''}
                  onChange={(e) => handleChange('card_title_ar', e.target.value)}
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
                  value={formData.card_title_en || ''}
                  onChange={(e) => handleChange('card_title_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Body Text */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'نص البطاقة التشجيعي' : 'Card Incentive Copy'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'النص بالعربية' : 'Arabic Text'}
                </label>
                <textarea
                  rows={3}
                  value={formData.card_text_ar || ''}
                  onChange={(e) => handleChange('card_text_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none resize-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'النص بالإنجليزية' : 'English Text'}
                </label>
                <textarea
                  rows={3}
                  value={formData.card_text_en || ''}
                  onChange={(e) => handleChange('card_text_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none resize-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Badge text */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'شارة المكافأة' : 'Reward Badge Text'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'نص الشارة بالعربية' : 'Badge Text (AR)'}
                </label>
                <input
                  type="text"
                  value={formData.badge_text_ar || ''}
                  onChange={(e) => handleChange('badge_text_ar', e.target.value)}
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
                  value={formData.badge_text_en || ''}
                  onChange={(e) => handleChange('badge_text_en', e.target.value)}
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
