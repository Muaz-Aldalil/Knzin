'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { SystemNoticesSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function AdminSystemNoticesCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent, sectionData } =
    useAdminCmsSection<SystemNoticesSectionContent>('system_notices');

  const [formData, setFormData] = useState<SystemNoticesSectionContent | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = <K extends keyof SystemNoticesSectionContent>(
    field: K,
    value: SystemNoticesSectionContent[K]
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
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-content-secondary">
            {isAr ? 'جارِ تحميل إعدادات إشعارات النظام...' : 'Loading system notices configuration...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'إشعارات النظام وأخطاء التوجيه (System Notices & Error Presentation)' : 'System Notices & Error Presentation'}
        description={
          isAr
            ? 'التحكم في رسائل وأزرار صفحات الخطأ 404 (الصفحة غير موجودة) وحدود معالجة الأخطاء غير المتوقعة 500.'
            : 'Configure copy, recovery buttons, and guidance for 404 Not Found and application error boundaries.'
        }
        icon={AlertTriangle}
        targetRoute="/404-preview"
        isSaving={isUpdating}
        isSaved={isSuccess}
        errorMessage={error?.message}
        updatedAt={sectionData?.updated_at}
        onSave={handleSave}
      >
        {/* 404 Not Found Page Configuration */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'صفحة الصفحة غير موجودة (404 Not Found)' : '404 Not Found Page'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان الخطأ 404 (عربي)' : '404 Title (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.not_found_title_ar}
                onChange={(e) => handleChange('not_found_title_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان الخطأ 404 (إنجليزي)' : '404 Title (English)'}
              </label>
              <input
                type="text"
                value={formData.not_found_title_en}
                onChange={(e) => handleChange('not_found_title_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'رسالة الخطأ والتوجيه (عربي)' : '404 Description (Arabic)'}
              </label>
              <textarea
                rows={2}
                value={formData.not_found_desc_ar}
                onChange={(e) => handleChange('not_found_desc_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'رسالة الخطأ والتوجيه (إنجليزي)' : '404 Description (English)'}
              </label>
              <textarea
                rows={2}
                value={formData.not_found_desc_en}
                onChange={(e) => handleChange('not_found_desc_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'زر العودة للرئيسية (عربي)' : 'Home Button Label (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.not_found_home_btn_ar}
                onChange={(e) => handleChange('not_found_home_btn_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'زر العودة للرئيسية (إنجليزي)' : 'Home Button Label (English)'}
              </label>
              <input
                type="text"
                value={formData.not_found_home_btn_en}
                onChange={(e) => handleChange('not_found_home_btn_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'زر الذهاب للبحث (عربي)' : 'Search Button Label (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.not_found_search_btn_ar}
                onChange={(e) => handleChange('not_found_search_btn_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'زر الذهاب للبحث (إنجليزي)' : 'Search Button Label (English)'}
              </label>
              <input
                type="text"
                value={formData.not_found_search_btn_en}
                onChange={(e) => handleChange('not_found_search_btn_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* 500 / Error Boundary Configuration */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'صفحة الخطأ غير المتوقع (Application Error Boundary)' : 'Application Error Boundary'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان الخطأ غير المتوقع (عربي)' : 'Error Title (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.error_title_ar}
                onChange={(e) => handleChange('error_title_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان الخطأ غير المتوقع (إنجليزي)' : 'Error Title (English)'}
              </label>
              <input
                type="text"
                value={formData.error_title_en}
                onChange={(e) => handleChange('error_title_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'شرح التوجيه عند حدوث الخطأ (عربي)' : 'Error Description (Arabic)'}
              </label>
              <textarea
                rows={2}
                value={formData.error_desc_ar}
                onChange={(e) => handleChange('error_desc_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'شرح التوجيه عند حدوث الخطأ (إنجليزي)' : 'Error Description (English)'}
              </label>
              <textarea
                rows={2}
                value={formData.error_desc_en}
                onChange={(e) => handleChange('error_desc_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'زر إعادة المحاولة (عربي)' : 'Retry Button Label (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.error_retry_btn_ar}
                onChange={(e) => handleChange('error_retry_btn_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'زر إعادة المحاولة (إنجليزي)' : 'Retry Button Label (English)'}
              </label>
              <input
                type="text"
                value={formData.error_retry_btn_en}
                onChange={(e) => handleChange('error_retry_btn_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'زر العودة للرئيسية (عربي)' : 'Home Button Label (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.error_home_btn_ar}
                onChange={(e) => handleChange('error_home_btn_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'زر العودة للرئيسية (إنجليزي)' : 'Home Button Label (English)'}
              </label>
              <input
                type="text"
                value={formData.error_home_btn_en}
                onChange={(e) => handleChange('error_home_btn_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </CmsFormLayout>
    </AdminGuard>
  );
}
