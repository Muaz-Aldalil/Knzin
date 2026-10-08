'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { DrawContentSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { Trophy, Loader2, ShieldAlert } from 'lucide-react';

export default function AdminHallOfFameCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent } =
    useAdminCmsSection<DrawContentSectionContent>('draw_content');

  const [formData, setFormData] = useState<DrawContentSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = (field: keyof DrawContentSectionContent, value: any) => {
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
            {isAr ? 'جارِ تحميل إعدادات لوحة الشرف...' : 'Loading Hall of Fame settings...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'لوحة الشرف وتوثيق الفائزين' : 'Hall of Fame Presentation'}
        description={
          isAr
            ? 'تعديل نصوص ورسائل قسم توثيق الفائزين مع حماية تامة وغير قابلة للالتفاف للنتائج والبذور التشفيرية والتذاكر الرابحة.'
            : 'Configure public Hall of Fame headings and delivery documentation copy without altering cryptographically committed draw records.'
        }
        icon={Trophy}
        isSaving={isUpdating}
        isSaved={isSuccess}
        errorMessage={error?.message}
        onSave={handleSave}
      >
        <div className="space-y-6">
          {/* Safeguard Notice */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>
              {isAr
                ? 'تنبيه أمني: نتائج السحب، هوية الفائز المعتمدة، والتجزئة التشفيرية (Provably Fair) محمية بقواعد برمجية غير قابلة للتعديل من خلال واجهة إدارة المحتوى.'
                : 'Security Notice: Canonical draw outcomes, winner identities, and Provably Fair cryptographic proofs are immutable and protected from CMS overrides.'}
            </span>
          </div>

          {/* Titles */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'عنوان لوحة الشرف' : 'Hall of Fame Heading'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'العنوان بالعربية' : 'Arabic Heading'}
                </label>
                <input
                  type="text"
                  value={formData.hall_of_fame_title_ar || ''}
                  onChange={(e) => handleChange('hall_of_fame_title_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'العنوان بالإنجليزية' : 'English Heading'}
                </label>
                <input
                  type="text"
                  value={formData.hall_of_fame_title_en || ''}
                  onChange={(e) => handleChange('hall_of_fame_title_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Subtitles */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              {isAr ? 'الوصف الفرعي ورسالة التوثيق' : 'Documentation Subtitle Copy'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الوصف بالعربية' : 'Arabic Subtitle'}
                </label>
                <textarea
                  rows={3}
                  value={formData.hall_of_fame_subtitle_ar || ''}
                  onChange={(e) => handleChange('hall_of_fame_subtitle_ar', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none resize-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  {isAr ? 'الوصف بالإنجليزية' : 'English Subtitle'}
                </label>
                <textarea
                  rows={3}
                  value={formData.hall_of_fame_subtitle_en || ''}
                  onChange={(e) => handleChange('hall_of_fame_subtitle_en', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-primary outline-none resize-none"
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
