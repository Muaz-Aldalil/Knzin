'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { getStoredPageDraft, applyPageDraft, clearPageDraft } from '@/lib/admin/draft-preservation';
import { FileEdit, Check, X, RotateCcw } from 'lucide-react';

export function DraftRestoreBanner() {
  const pathname = usePathname();
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [hasDraft, setHasDraft] = useState(false);
  const [restoredCount, setRestoredCount] = useState<number | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const draft = getStoredPageDraft(pathname);
    setHasDraft(!!draft && Object.keys(draft.fields).length > 0);
  }, [pathname]);

  if (!hasDraft && restoredCount === null) return null;

  if (restoredCount !== null) {
    return (
      <div
        data-testid="admin-draft-restored-success"
        className="mb-6 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            {isAr
              ? `تم استعادة ${restoredCount} حقول من المسودة المحفوظة بنجاح.`
              : `Successfully restored ${restoredCount} fields from saved draft.`}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setRestoredCount(null)}
          className="p-1 rounded-lg hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const handleRestore = () => {
    if (!pathname) return;
    const count = applyPageDraft(pathname);
    setHasDraft(false);
    setRestoredCount(count);
  };

  const handleDismiss = () => {
    if (!pathname) return;
    clearPageDraft(pathname);
    setHasDraft(false);
  };

  return (
    <div
      data-testid="admin-draft-restore-banner"
      className="mb-6 p-4 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center text-brand-gold shrink-0">
          <FileEdit className="w-6 h-6 text-brand-gold" />
        </div>
        <div>
          <p className="text-xs font-bold text-content-primary">
            {isAr ? 'مسودة محفوظة تلقائياً متوفرة' : 'Auto-Saved Draft Available'}
          </p>
          <p className="text-[11px] text-content-secondary mt-0.5">
            {isAr
              ? 'تم العثور على بيانات غير محفوظة من جلستك السابقة في هذه الصفحة.'
              : 'Unsaved form data from your previous session was found on this page.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          type="button"
          onClick={handleDismiss}
          data-testid="admin-draft-dismiss-btn"
          className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-medium text-content-muted hover:text-content-primary hover:bg-surface-elevated transition-colors cursor-pointer"
        >
          {isAr ? 'تجاهل' : 'Discard'}
        </button>

        <button
          type="button"
          onClick={handleRestore}
          data-testid="admin-draft-restore-btn"
          className="px-3.5 py-1.5 rounded-lg bg-brand-gold hover:bg-brand-gold-light text-brand-navy text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isAr ? 'استعادة المسودة' : 'Restore Draft'}</span>
        </button>
      </div>
    </div>
  );
}
