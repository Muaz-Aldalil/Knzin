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
      <div className="flex items-center gap-1.5 font-bold text-content-primary">
        <Filter className="w-4 h-4 text-brand-gold" />
        <span>{isAr ? 'تصفية السجل:' : 'Filter Trail:'}</span>
      </div>

      <input
        type="text"
        value={actor}
        onChange={(e) => setActor(e.target.value)}
        placeholder={isAr ? 'بريد المشرف...' : 'Admin email...'}
        className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border-subtle text-content-primary focus:border-brand-gold focus:outline-hidden"
      />

      <input
        type="text"
        value={action}
        onChange={(e) => setAction(e.target.value)}
        placeholder={isAr ? 'اسم العملية (مثل settings_updated)...' : 'Action name...'}
        className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border-subtle text-content-primary focus:border-brand-gold focus:outline-hidden"
      />

      <select
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border-subtle text-content-primary focus:border-brand-gold focus:outline-hidden"
      >
        <option value="">{isAr ? 'جميع النتائج' : 'All outcomes'}</option>
        <option value="success">{isAr ? 'نجاح (Success)' : 'Success'}</option>
        <option value="failure">{isAr ? 'فشل (Failure)' : 'Failure'}</option>
      </select>

      <button
        type="submit"
        className="px-4 py-1.5 rounded-lg bg-brand-gold text-brand-navy font-bold hover:bg-brand-gold-light transition-colors"
      >
        {isAr ? 'تطبيق' : 'Apply'}
      </button>

      {(actor || action || outcome) && (
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-subtle text-content-secondary hover:text-content-primary"
        >
          <X className="w-3.5 h-3.5" />
          <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
        </button>
      )}
    </form>
  );
}
