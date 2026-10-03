'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { DrawRecord } from '@/types/admin';
import { CreateDrawPayload, UpdateDrawPayload } from '@/hooks/admin/useAdminDraws';
import { Sparkles, Loader2 } from 'lucide-react';

interface DrawFormProps {
  initialDraw?: DrawRecord;
  onSubmit: (payload: CreateDrawPayload | UpdateDrawPayload) => Promise<any>;
  isLoading?: boolean;
}

export function DrawForm({ initialDraw, onSubmit, isLoading = false }: DrawFormProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const isEditing = !!initialDraw;

  const [tier, setTier] = useState<'hourly' | 'daily' | 'monthly'>(initialDraw?.tier ?? 'monthly');
  const [executionType, setExecutionType] = useState<'automated_electronic' | 'live_broadcast'>(
    initialDraw?.execution_type ?? 'automated_electronic'
  );
  const [titleAr, setTitleAr] = useState(initialDraw?.title_ar ?? '');
  const [titleEn, setTitleEn] = useState(initialDraw?.title_en ?? '');
  const [startsAt, setStartsAt] = useState(
    initialDraw?.starts_at ? initialDraw.starts_at.slice(0, 16) : new Date().toISOString().slice(0, 16)
  );
  const [endsAt, setEndsAt] = useState(
    initialDraw?.ends_at
      ? initialDraw.ends_at.slice(0, 16)
      : new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      title_ar: titleAr.trim(),
      title_en: titleEn.trim(),
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
    };

    if (!isEditing) {
      payload.tier = tier;
      payload.execution_type = executionType;
    }

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-5" data-testid="admin-draw-form">
      <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-brand-gold" />
        <span>{isEditing ? (isAr ? 'تعديل بيانات السحب' : 'Edit Draw Details') : (isAr ? 'إنشاء مسودة سحب جديدة' : 'Create New Draw Draft')}</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-content-primary block mb-1">
            {isAr ? 'عنوان السحب (بالعربية):' : 'Title (Arabic):'}
          </label>
          <input
            type="text"
            required
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            placeholder="مثال: سحب الجائزة الكبرى الشهري"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-sm focus:border-brand-gold focus:outline-hidden"
            data-testid="input-draw-title-ar"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-content-primary block mb-1">
            {isAr ? 'عنوان السحب (بالإنجليزية):' : 'Title (English):'}
          </label>
          <input
            type="text"
            required
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="e.g. Monthly Grand Prize Draw"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-sm focus:border-brand-gold focus:outline-hidden"
            data-testid="input-draw-title-en"
          />
        </div>
      </div>

      {!isEditing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-content-primary block mb-1">
              {isAr ? 'دورية السحب (Tier):' : 'Draw Tier:'}
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-sm focus:border-brand-gold focus:outline-hidden"
              data-testid="select-draw-tier"
            >
              <option value="hourly">{isAr ? 'ساعي (Hourly)' : 'Hourly'}</option>
              <option value="daily">{isAr ? 'يومي (Daily)' : 'Daily'}</option>
              <option value="monthly">{isAr ? 'شهري (Monthly)' : 'Monthly'}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-content-primary block mb-1">
              {isAr ? 'طريقة التنفيذ:' : 'Execution Type:'}
            </label>
            <select
              value={executionType}
              onChange={(e) => setExecutionType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary text-sm focus:border-brand-gold focus:outline-hidden"
              data-testid="select-draw-execution"
            >
              <option value="automated_electronic">{isAr ? 'إلكتروني مؤتمت (Automated)' : 'Automated Electronic'}</option>
              <option value="live_broadcast">{isAr ? 'بث مباشر مرئي (Live Broadcast)' : 'Live Broadcast'}</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-content-primary block mb-1">
            {isAr ? 'تاريخ ووقت البدء:' : 'Start Date & Time:'}
          </label>
          <input
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary font-mono text-sm focus:border-brand-gold focus:outline-hidden"
            data-testid="input-draw-starts-at"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-content-primary block mb-1">
            {isAr ? 'تاريخ ووقت الإغلاق:' : 'End Date & Time:'}
          </label>
          <input
            type="datetime-local"
            required
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary font-mono text-sm focus:border-brand-gold focus:outline-hidden"
            data-testid="input-draw-ends-at"
          />
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-border-subtle">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-brand-navy font-bold text-sm shadow-xs transition-colors disabled:opacity-50"
          data-testid="submit-draw-form-button"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isEditing ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إنشاء المسودة' : 'Create Draft')}</span>
        </button>
      </div>
    </form>
  );
}
