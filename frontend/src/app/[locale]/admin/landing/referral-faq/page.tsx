'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminCmsSection } from '@/hooks/admin/useAdminCms';
import { ReferralFaqSectionContent, FaqItem } from '@/types/cms';
import { CmsFormLayout } from '@/components/admin/cms/CmsFormLayout';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ScrollText, Loader2, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export default function AdminReferralFaqCmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { content, isLoading, isUpdating, isSuccess, error, updateContent } =
    useAdminCmsSection<ReferralFaqSectionContent>('referral_faq');

  const [formData, setFormData] = useState<ReferralFaqSectionContent | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ index: number; label: string } | null>(null);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleChange = (field: keyof ReferralFaqSectionContent, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleItemChange = (index: number, field: keyof FaqItem, value: string) => {
    if (!formData) return;
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleAddItem = () => {
    if (!formData) return;
    const newItem: FaqItem = {
      id: `faq-${Date.now()}`,
      question_ar: '',
      question_en: '',
      answer_ar: '',
      answer_en: '',
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const handleConfirmDelete = () => {
    if (!formData || itemToDelete === null) return;
    const newItems = formData.items.filter((_, i) => i !== itemToDelete.index);
    setFormData({ ...formData, items: newItems });
    setItemToDelete(null);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!formData) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.items.length) return;

    const newItems = [...formData.items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setFormData({ ...formData, items: newItems });
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
            {isAr ? 'جارِ تحميل إعدادات الأسئلة الشائعة...' : 'Loading FAQ items...'}
          </p>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <CmsFormLayout
        title={isAr ? 'الأسئلة الشائعة حول المنصة والجوائز' : 'Promotional Referral FAQ'}
        description={
          isAr
            ? 'إضافة، تعديل، ترتيب، وحذف عناصر الأسئلة الشائعة المعروضة في الأكورديون باللغتين العربية والإنجليزية.'
            : 'Add, update, reorder, or remove bilingual accordion FAQ items.'
        }
        icon={ScrollText}
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
                {isAr ? 'ظهور قسم الأسئلة الشائعة' : 'FAQ Section Visibility'}
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                {isAr ? 'إظهار أو إخفاء قسم الأسئلة الشائعة في الصفحة الرئيسية.' : 'Enable or disable display of the FAQ section on the public landing page.'}
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
              {isAr ? 'عنوان قسم الأسئلة الشائعة' : 'FAQ Section Title'}
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

          {/* FAQ Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-content-primary">
                {isAr ? 'قائمة الأسئلة الشائعة' : 'Questions & Answers'} ({formData.items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 hover:bg-brand-gold/25 font-bold text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إضافة سؤال جديد' : 'Add New Question'}</span>
              </button>
            </div>

            {formData.items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-5 rounded-2xl bg-surface border border-border-subtle space-y-4 relative"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-surface-elevated border border-border-subtle text-xs font-bold text-brand-gold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-content-secondary">
                      {isAr ? `البند #${idx + 1}` : `Item #${idx + 1}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1.5 rounded-lg border border-border-subtle hover:bg-surface-elevated disabled:opacity-30 cursor-pointer"
                      title={isAr ? 'تحريك للأعلى' : 'Move Up'}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === formData.items.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1.5 rounded-lg border border-border-subtle hover:bg-surface-elevated disabled:opacity-30 cursor-pointer"
                      title={isAr ? 'تحريك للأسفل' : 'Move Down'}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setItemToDelete({
                          index: idx,
                          label:
                            item.question_ar ||
                            item.question_en ||
                            (isAr ? `السؤال #${idx + 1}` : `Question #${idx + 1}`),
                        })
                      }
                      className="p-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 cursor-pointer ms-2"
                      title={isAr ? 'حذف السؤال' : 'Delete Question'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      {isAr ? 'السؤال بالعربية' : 'Question (AR)'}
                    </label>
                    <input
                      type="text"
                      value={item.question_ar || ''}
                      onChange={(e) => handleItemChange(idx, 'question_ar', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      {isAr ? 'السؤال بالإنجليزية' : 'Question (EN)'}
                    </label>
                    <input
                      type="text"
                      value={item.question_en || ''}
                      onChange={(e) => handleItemChange(idx, 'question_en', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Answers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      {isAr ? 'الإجابة بالعربية' : 'Answer (AR)'}
                    </label>
                    <textarea
                      rows={3}
                      value={item.answer_ar || ''}
                      onChange={(e) => handleItemChange(idx, 'answer_ar', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none resize-none"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">
                      {isAr ? 'الإجابة بالإنجليزية' : 'Answer (EN)'}
                    </label>
                    <textarea
                      rows={3}
                      value={item.answer_en || ''}
                      onChange={(e) => handleItemChange(idx, 'answer_en', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold outline-none resize-none"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CmsFormLayout>

      {/* Delete Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={itemToDelete !== null}
        title={isAr ? 'حذف سؤال من الأسئلة الشائعة' : 'Delete FAQ Item'}
        description={
          isAr
            ? `هل أنت متأكد من رغبتك في حذف "${itemToDelete?.label}"؟ لا يمكن التراجع عن هذا الإجراء بعد حفظ التغييرات.`
            : `Are you sure you want to remove "${itemToDelete?.label}"? This action cannot be undone once saved.`
        }
        confirmText={isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
        cancelText={isAr ? 'إلغاء' : 'Cancel'}
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onClose={() => setItemToDelete(null)}
      />
    </AdminGuard>
  );
}
