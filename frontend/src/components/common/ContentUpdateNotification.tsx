'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { Sparkles, RefreshCw, X } from 'lucide-react';

interface ContentUpdateNotificationProps {
  hasUpdate: boolean;
  onApply: () => void;
  onDismiss: () => void;
}

export function ContentUpdateNotification({
  hasUpdate,
  onApply,
  onDismiss,
}: ContentUpdateNotificationProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  if (!hasUpdate) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-40 max-w-md w-[92%] sm:w-auto animate-in fade-in slide-in-from-top-4 duration-300 ease-out select-none"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface/95 dark:bg-surface-elevated/95 backdrop-blur-md border border-brand-gold/40 shadow-xl shadow-brand-gold/5 text-content-primary">
        <div className="flex items-center gap-2">
          <div className="text-brand-gold flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm font-semibold truncate">
            {isAr ? 'تم نشر تحديثات جديدة للصفحة' : 'New page updates published'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 ms-auto shrink-0">
          <button
            type="button"
            onClick={onApply}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-navy font-bold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحديث الآن' : 'Update View'}</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            aria-label={isAr ? 'إغلاق الإشعار' : 'Dismiss notice'}
            className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
