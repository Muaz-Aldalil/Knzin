'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { PrizeRecord } from '@/types/admin';
import { CreatePrizePayload } from '@/hooks/admin/useAdminDraws';
import { MoneyText } from './MoneyText';
import { useAdminFeedback } from './AdminFeedbackContext';
import { Gift, Plus, Trash2, Loader2, Sparkles } from 'lucide-react';

interface PrizeEditorProps {
  prizes: PrizeRecord[];
  isLocked: boolean;
  onAddPrize: (payload: CreatePrizePayload) => Promise<any>;
  onDeletePrize: (prizeId: number) => Promise<any>;
}

export function PrizeEditor({ prizes, isLocked, onAddPrize, onDeletePrize }: PrizeEditorProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { showSuccess, showError } = useAdminFeedback();

  const [isOpen, setIsOpen] = useState(false);
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [category, setCategory] = useState<'cash' | 'merchandise'>('cash');
  const [usdValue, setUsdValue] = useState<number>(100);
  const [iqdLabel, setIqdLabel] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isLoading) return;

    try {
      setIsLoading(true);
      await onAddPrize({
        title_ar: titleAr.trim(),
        title_en: titleEn.trim(),
        category,
        retail_value_usd_cents: Math.round(usdValue * 100),
        display_iqd_label: iqdLabel.trim() || undefined,
        rank_order: prizes.length + 1,
        image_url: imageUrl.trim() || undefined,
      });
      setTitleAr('');
      setTitleEn('');
      setIqdLabel('');
      setImageUrl('');
      setIsOpen(false);
      showSuccess(isAr ? 'تمت إضافة الجائزة بنجاح.' : 'Prize added successfully.');
    } catch (err: any) {
      showError(err?.message || (isAr ? 'فشلت إضافة الجائزة.' : 'Failed to add prize.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (isLocked) return;
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذه الجائزة؟' : 'Are you sure you want to delete this prize?')) {
      await onDeletePrize(id);
    }
  };

  return (
    <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
            <Gift className="w-5 h-5 text-brand-gold" />
            <span>{isAr ? 'جوائز السحب المعتمدة' : 'Draw Prize Inventory'}</span>
          </h3>
          <p className="text-xs text-content-secondary mt-0.5">
            {isAr
              ? 'تحدد الجوائز قبل النشر. بعد إغلاق السحب لا يمكن تعديل أو حذف الجوائز.'
              : 'Configured prizes. Mutating prizes is strictly locked after draw closure.'}
          </p>
        </div>

        {!isLocked && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold border border-brand-gold/20 text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة جائزة' : 'Add Prize'}</span>
          </button>
        )}
      </div>

      {/* Add Prize Form */}
      {isOpen && !isLocked && (
        <form onSubmit={handleAdd} className="p-4 rounded-xl bg-surface-elevated border border-border-subtle space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-content-primary block mb-1">
                {isAr ? 'اسم الجائزة (بالعربية):' : 'Title (Arabic):'}
              </label>
              <input
                type="text"
                required
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="مثال: سيارة شيري تيجو 8 برو"
                className="w-full px-3 py-2 rounded-lg bg-surface-card border border-border-subtle text-xs text-content-primary focus:border-brand-gold focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-content-primary block mb-1">
                {isAr ? 'اسم الجائزة (بالإنجليزية):' : 'Title (English):'}
              </label>
              <input
                type="text"
                required
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. Chery Tiggo 8 Pro"
                className="w-full px-3 py-2 rounded-lg bg-surface-card border border-border-subtle text-xs text-content-primary focus:border-brand-gold focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-content-primary block mb-1">
                {isAr ? 'النوع:' : 'Category:'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-surface-card border border-border-subtle text-xs text-content-primary focus:border-brand-gold focus:outline-hidden"
              >
                <option value="cash">{isAr ? 'نقدي (Cash)' : 'Cash'}</option>
                <option value="merchandise">{isAr ? 'عيني (Merchandise)' : 'Merchandise'}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-content-primary block mb-1">
                {isAr ? 'القيمة ($ USD):' : 'Value ($ USD):'}
              </label>
              <input
                type="number"
                min="1"
                required
                value={usdValue}
                onChange={(e) => setUsdValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg bg-surface-card border border-border-subtle text-xs text-content-primary font-mono focus:border-brand-gold focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-content-secondary block mb-1">
                {isAr ? 'تسمية الدينار (اختياري):' : 'IQD Label (Optional):'}
              </label>
              <input
                type="text"
                value={iqdLabel}
                onChange={(e) => setIqdLabel(e.target.value)}
                placeholder="130,000,000 IQD"
                className="w-full px-3 py-2 rounded-lg bg-surface-card border border-border-subtle text-xs text-content-primary focus:border-brand-gold focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-content-secondary"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-gold text-brand-navy font-bold text-xs shadow-xs"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isAr ? 'حفظ الجائزة' : 'Save Prize'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Prizes List */}
      <div className="divide-y divide-border-subtle">
        {prizes.length === 0 ? (
          <p className="text-xs text-content-muted py-4 text-center">
            {isAr ? 'لا توجد جوائز مضافة لهذا السحب بعد.' : 'No prizes added to this draw yet.'}
          </p>
        ) : (
          prizes.map((p) => (
            <div key={p.id} className="py-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-content-primary block">
                  {isAr ? p.title_ar : p.title_en}
                </span>
                <span className="text-xs text-content-secondary">
                  {p.category === 'cash' ? (isAr ? 'نقدي' : 'Cash') : (isAr ? 'عيني' : 'Merchandise')} •{' '}
                  {p.display_iqd_label || `${p.retail_value_usd_cents / 100}$`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MoneyText cents={p.retail_value_usd_cents} className="text-sm font-bold text-emerald-400" />
                {!isLocked && (
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg text-content-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
