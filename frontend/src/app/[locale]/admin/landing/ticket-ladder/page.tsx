'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { TicketLadderSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { BadgeDollarSign, Loader2 } from 'lucide-react';

export default function AdminTicketLadderCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent } =
    useAdminCmsSection<TicketLadderSectionContent>('ticket_ladder');

  const [formData, setFormData] = useState<TicketLadderSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = (field: keyof TicketLadderSectionContent, value: any) => {
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
            {isAr ? 'جارِ تحميل إعدادات سلم التذاكر...' : 'Loading ticket ladder settings...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'سلم التذاكر الترويجية' : 'Promotional Ticket Ladder'}
        description={
          isAr
            ? 'تعديل جدول توزيع التذاكر الترويجية المجانية المرفقة مع الأجزاء الفردية والباقات الكاملة دون تغيير محرك إصدار التذاكر الفعلي.'
            : 'Configure public presentation of sweepstakes tickets awarded per course part or complete bundle.'
        }
        icon={BadgeDollarSign}
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
                {isAr ? 'إظهار أو إخفاء بطاقة سلم التذاكر الترويجية.' : 'Show or hide the promotional ticket ladder on the public landing page.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.is_visible}
              onChange={(e) => handleChange('is_visible', e.target.checked)}
              className="w-5 h-5 rounded text-brand-gold focus:ring-brand-gold cursor-pointer"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Rates Text */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'نصوص توزيع التذاكر الترويجية' : 'Promotional Ticket Allocation Copy'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'معدل الجزء التدريبي الفردي (عربي)' : 'Single Course Part Rate (AR)'}
                </label>
                <input
                  type="text"
                  value={formData.part_rate_text_ar || ''}
                  onChange={(e) => handleChange('part_rate_text_ar', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'معدل الجزء التدريبي الفردي (إنجليزي)' : 'Single Course Part Rate (EN)'}
                </label>
                <input
                  type="text"
                  value={formData.part_rate_text_en || ''}
                  onChange={(e) => handleChange('part_rate_text_en', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'معدل الدورة التدريبية الكاملة (عربي)' : 'Complete Course Bundle Rate (AR)'}
                </label>
                <input
                  type="text"
                  value={formData.bundle_rate_text_ar || ''}
                  onChange={(e) => handleChange('bundle_rate_text_ar', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'معدل الدورة التدريبية الكاملة (إنجليزي)' : 'Complete Course Bundle Rate (EN)'}
                </label>
                <input
                  type="text"
                  value={formData.bundle_rate_text_en || ''}
                  onChange={(e) => handleChange('bundle_rate_text_en', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'إخلاء المسؤولية القانوني' : 'Legal Disclaimer'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الإخلاء بالعربية' : 'Arabic Disclaimer'}
                </label>
                <textarea
                  rows={3}
                  value={formData.disclaimer_ar || ''}
                  onChange={(e) => handleChange('disclaimer_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none resize-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الإخلاء بالإنجليزية' : 'English Disclaimer'}
                </label>
                <textarea
                  rows={3}
                  value={formData.disclaimer_en || ''}
                  onChange={(e) => handleChange('disclaimer_en', e.target.value)}
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
