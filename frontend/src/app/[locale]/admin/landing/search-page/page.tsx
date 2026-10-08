'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { SearchPageSectionContent } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { Search, Loader2, Plus, Trash2 } from 'lucide-react';

export default function AdminSearchPageCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent, sectionData } =
    useAdminCmsSection<SearchPageSectionContent>('search_page');

  const [formData, setFormData] = useState<SearchPageSectionContent | null>(null);
  const [newQueryAr, setNewQueryAr] = useState('');
  const [newQueryEn, setNewQueryEn] = useState('');
  const [newTipAr, setNewTipAr] = useState('');
  const [newTipEn, setNewTipEn] = useState('');

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = <K extends keyof SearchPageSectionContent>(
    field: K,
    value: SearchPageSectionContent[K]
  ) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleAddQuery = () => {
    if (!newQueryAr.trim() && !newQueryEn.trim()) return;
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        suggested_queries_ar: [...(prev.suggested_queries_ar || []), newQueryAr.trim() || newQueryEn.trim()],
        suggested_queries_en: [...(prev.suggested_queries_en || []), newQueryEn.trim() || newQueryAr.trim()],
      };
    });
    setNewQueryAr('');
    setNewQueryEn('');
  };

  const handleRemoveQuery = (index: number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        suggested_queries_ar: prev.suggested_queries_ar.filter((_, i) => i !== index),
        suggested_queries_en: prev.suggested_queries_en.filter((_, i) => i !== index),
      };
    });
  };

  const handleAddTip = () => {
    if (!newTipAr.trim() && !newTipEn.trim()) return;
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        search_tips_items_ar: [...(prev.search_tips_items_ar || []), newTipAr.trim() || newTipEn.trim()],
        search_tips_items_en: [...(prev.search_tips_items_en || []), newTipEn.trim() || newTipAr.trim()],
      };
    });
    setNewTipAr('');
    setNewTipEn('');
  };

  const handleRemoveTip = (index: number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        search_tips_items_ar: prev.search_tips_items_ar.filter((_, i) => i !== index),
        search_tips_items_en: prev.search_tips_items_en.filter((_, i) => i !== index),
      };
    });
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
            {isAr ? 'جارِ تحميل إعدادات صفحة البحث...' : 'Loading search page configuration...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'صفحة البحث الذكي (Smart Search Hub Presentation)' : 'Smart Search Hub Presentation'}
        description={
          isAr
            ? 'التحكم في عنوان البحث التوجيهي، وسوم الكلمات المقترحة، نصائح البحث، وحالة البحث دون نتائج.'
            : 'Configure search hub header, suggested query chips, search guidelines, and zero-results empty states.'
        }
        icon={Search}
        targetRoute="/search"
        isSaving={isUpdating}
        isSaved={isSuccess}
        errorMessage={error?.message}
        updatedAt={sectionData?.updated_at}
        onSave={handleSave}
      >
        {/* Section Visibility */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-content-primary">
              {isAr ? 'تفعيل مقترحات ونصائح البحث' : 'Search Guidance & Tips Visibility'}
            </h2>
            <p className="text-xs text-content-secondary mt-1">
              {isAr
                ? 'إظهار أو إخفاء النصائح ومقترحات البحث الاسترشادية'
                : 'Toggle suggested queries chips and search tips display'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.is_visible}
              onChange={(e) => handleChange('is_visible', e.target.checked)}
            />
            <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border-subtle after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Search Hero & Placeholder */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'واجهة ورأس صفحة البحث (Search Header & Input)' : 'Search Header & Input'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان البحث الرئيسي (عربي)' : 'Hero Headline (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.hero_headline_ar}
                onChange={(e) => handleChange('hero_headline_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان البحث الرئيسي (إنجليزي)' : 'Hero Headline (English)'}
              </label>
              <input
                type="text"
                value={formData.hero_headline_en}
                onChange={(e) => handleChange('hero_headline_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'الوصف التوجيهي (عربي)' : 'Hero Subtitle (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.hero_subtitle_ar}
                onChange={(e) => handleChange('hero_subtitle_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'الوصف التوجيهي (إنجليزي)' : 'Hero Subtitle (English)'}
              </label>
              <input
                type="text"
                value={formData.hero_subtitle_en}
                onChange={(e) => handleChange('hero_subtitle_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'نص حقل الإدخال (Placeholder عربي)' : 'Search Placeholder (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.search_placeholder_ar}
                onChange={(e) => handleChange('search_placeholder_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'نص حقل الإدخال (Placeholder إنجليزي)' : 'Search Placeholder (English)'}
              </label>
              <input
                type="text"
                value={formData.search_placeholder_en}
                onChange={(e) => handleChange('search_placeholder_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Suggested Queries Chips */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'الكلمات والعبارات المقترحة (Suggested Query Chips)' : 'Suggested Query Chips'}
          </h2>
          <div className="space-y-3">
            {(formData.suggested_queries_ar || []).map((queryAr, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-hover border border-border-subtle text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-content-primary">{queryAr}</span>
                  <span className="text-content-secondary text-xs">/ {formData.suggested_queries_en[idx]}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveQuery(idx)}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <input
              type="text"
              placeholder={isAr ? 'كلمة مفتاحية جديدة (عربي)' : 'New query (Arabic)'}
              value={newQueryAr}
              onChange={(e) => setNewQueryAr(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder={isAr ? 'كلمة مفتاحية جديدة (إنجليزي)' : 'New query (English)'}
              value={newQueryEn}
              onChange={(e) => setNewQueryEn(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleAddQuery}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary-hover/20 text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isAr ? 'إضافة كلمة مقترحة' : 'Add Suggested Query'}
          </button>
        </div>

        {/* Search Tips */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'نصائح البحث الذكي (Search Tips)' : 'Search Tips'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان صندوق النصائح (عربي)' : 'Tips Title (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.search_tips_title_ar}
                onChange={(e) => handleChange('search_tips_title_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان صندوق النصائح (إنجليزي)' : 'Tips Title (English)'}
              </label>
              <input
                type="text"
                value={formData.search_tips_title_en}
                onChange={(e) => handleChange('search_tips_title_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {(formData.search_tips_items_ar || []).map((tipAr, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-hover border border-border-subtle text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-content-primary">{tipAr}</span>
                  <span className="text-content-secondary text-xs">{formData.search_tips_items_en[idx]}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveTip(idx)}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <input
              type="text"
              placeholder={isAr ? 'نصيحة بحث إضافية (عربي)' : 'New search tip (Arabic)'}
              value={newTipAr}
              onChange={(e) => setNewTipAr(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder={isAr ? 'نصيحة بحث إضافية (إنجليزي)' : 'New search tip (English)'}
              value={newTipEn}
              onChange={(e) => setNewTipEn(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleAddTip}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary-hover/20 text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isAr ? 'إضافة نصيحة بحث' : 'Add Search Tip'}
          </button>
        </div>

        {/* Empty State Presentation */}
        <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-4">
          <h2 className="text-base font-bold text-content-primary border-b border-border-subtle pb-3">
            {isAr ? 'حالة عدم العثور على نتائج (Empty Search Results State)' : 'Empty Search Results State'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان حالة الفراغ (عربي)' : 'Empty State Title (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.empty_title_ar}
                onChange={(e) => handleChange('empty_title_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'عنوان حالة الفراغ (إنجليزي)' : 'Empty State Title (English)'}
              </label>
              <input
                type="text"
                value={formData.empty_title_en}
                onChange={(e) => handleChange('empty_title_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'شرح التوجيه عند عدم وجود نتائج (عربي)' : 'Empty State Description (Arabic)'}
              </label>
              <textarea
                rows={2}
                value={formData.empty_desc_ar}
                onChange={(e) => handleChange('empty_desc_ar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                {isAr ? 'شرح التوجيه عند عدم وجود نتائج (إنجليزي)' : 'Empty State Description (English)'}
              </label>
              <textarea
                rows={2}
                value={formData.empty_desc_en}
                onChange={(e) => handleChange('empty_desc_en', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border-subtle text-content-primary text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>
        </div>
      </CmsFormLayout>
    </AdminGuard>
  );
}
