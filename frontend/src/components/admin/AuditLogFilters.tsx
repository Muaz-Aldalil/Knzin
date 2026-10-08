'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { AuditLogFilters } from '@/hooks/admin/useAdminAuditLogs';
import { Filter, Search, X } from 'lucide-react';

interface AuditLogFiltersProps {
  filters: AuditLogFilters;
  onFilterChange: (filters: AuditLogFilters) => void;
}

export function AuditLogFilterControls({ filters, onFilterChange }: AuditLogFiltersProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [actor, setActor] = useState(filters.actor || '');
  const [action, setAction] = useState(filters.action || '');
  const [outcome, setOutcome] = useState(filters.outcome || '');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      actor: actor.trim() || undefined,
      action: action.trim() || undefined,
      outcome: outcome || undefined,
    });
  };

  const handleReset = () => {
    setActor('');
    setAction('');
    setOutcome('');
    onFilterChange({});
  };

  return (
    <form
      onSubmit={handleApply}
      className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex flex-wrap items-center gap-3 text-xs"
    >
      <div className="flex items-center gap-1.5 font-bold text-content-primary shrink-0">
        <Filter className="w-4 h-4 text-primary" />
        <span>{isAr ? 'تصفية السجل:' : 'Filter Trail:'}</span>
      </div>

      <input
        type="text"
        value={actor}
        onChange={(e) => setActor(e.target.value)}
        placeholder={isAr ? 'بريد المشرف...' : 'Admin email...'}
        className="flex-1 min-w-[140px] sm:min-w-[180px] px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary focus:border-primary focus:outline-hidden transition-colors"
      />

      <input
        type="text"
        value={action}
        onChange={(e) => setAction(e.target.value)}
        placeholder={isAr ? 'اسم العملية (مثل settings_updated)...' : 'Action name...'}
        className="flex-1 min-w-[140px] sm:min-w-[180px] px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary focus:border-primary focus:outline-hidden transition-colors"
      />

      <select
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        className="min-w-[130px] px-3 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-content-primary focus:border-primary focus:outline-hidden transition-colors cursor-pointer"
      >
        <option value="">{isAr ? 'جميع النتائج' : 'All outcomes'}</option>
        <option value="success">{isAr ? 'نجاح (Success)' : 'Success'}</option>
        <option value="failure">{isAr ? 'فشل (Failure)' : 'Failure'}</option>
      </select>

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-xs hover:shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
      >
        <Search className="w-3.5 h-3.5 text-white" />
        <span>{isAr ? 'تطبيق الفلتر' : 'Apply Filter'}</span>
      </button>

      {(actor || action || outcome) && (
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-border-subtle text-content-secondary hover:text-content-primary hover:bg-surface-elevated transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
        </button>
      )}
    </form>
  );
}
