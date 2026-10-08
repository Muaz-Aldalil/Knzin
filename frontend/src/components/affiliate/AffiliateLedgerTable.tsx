'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, XCircle, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { AffiliateLedgerEntryItem, AffiliateLedgerPagination, LedgerEntryType } from '@/hooks/useAffiliateLedger';

interface AffiliateLedgerTableProps {
  entries: AffiliateLedgerEntryItem[];
  pagination: AffiliateLedgerPagination;
  onPageChange: (newPage: number) => void;
  onTypeFilterChange: (type: LedgerEntryType) => void;
  selectedType: LedgerEntryType;
  isLoading: boolean;
}

export function AffiliateLedgerTable({
  entries,
  pagination,
  onPageChange,
  onTypeFilterChange,
  selectedType,
  isLoading,
}: AffiliateLedgerTableProps) {
  const t = useTranslations('affiliate');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const filterOptions: { label: string; value: LedgerEntryType }[] = [
    { label: isRtl ? 'الكل' : 'All', value: 'all' },
    { label: isRtl ? 'عمولات المبيعات' : 'Sales Commissions', value: 'sales_commission' },
    { label: isRtl ? 'مكافآت السحب (40%)' : '40% Co-Prize', value: 'co_prize_credit' },
    { label: isRtl ? 'سحوبات الأرباح' : 'Payout Debits', value: 'payout_debit' },
  ];

  const getStatusBadge = (status: AffiliateLedgerEntryItem['status']) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('statusAvailable')}</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{t('statusPending')}</span>
          </span>
        );
      case 'cleared':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('statusCleared')}</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
            <XCircle className="w-3.5 h-3.5" />
            <span>{t('statusCancelled')}</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: AffiliateLedgerEntryItem['entry_type']) => {
    switch (type) {
      case 'sales_commission':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>{isRtl ? 'عمولة بيع' : 'Sales Commission'}</span>
          </span>
        );
      case 'co_prize_credit':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>{isRtl ? 'مكافأة فوز 40%' : '40% Co-Prize'}</span>
          </span>
        );
      case 'payout_debit':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{isRtl ? 'سحب أرباح' : 'Payout Debit'}</span>
          </span>
        );
      case 'reversal_credit':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
            <span>{isRtl ? 'إعادة رصيد' : 'Reversal Credit'}</span>
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(isRtl ? 'ar-IQ' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-3xl p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-content-primary">
            {t('ledgerTitle')}
          </h3>
          <p className="text-xs text-content-secondary mt-1">
            {isRtl
              ? 'سجل مالي ثابت غير قابل للتعديل لكافة العمولات والمكافآت والسحوبات'
              : 'Immutable append-only ledger for all commissions, co-prizes, and payouts'}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-surface-secondary p-1 rounded-2xl border border-border-subtle">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onTypeFilterChange(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedType === opt.value
                  ? 'bg-surface text-content-primary shadow-xs'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Transaction Cards View (< md) */}
      <div className="md:hidden">
        {entries.length === 0 && !isLoading ? (
          <div className="text-center py-12 text-content-secondary">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">{t('emptyLedger')}</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {entries.map((entry) => {
              const isDebit = entry.entry_type === 'payout_debit';
              const formattedAmount = isDebit
                ? `-$${(Math.abs(entry.amount_cents) / 100).toFixed(2)}`
                : `+$${(Math.abs(entry.amount_cents) / 100).toFixed(2)}`;

              return (
                <div key={entry.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-content-muted">
                      {formatDate(entry.created_at)}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {getTypeBadge(entry.entry_type)}
                      {getStatusBadge(entry.status)}
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-xs font-semibold text-content-primary flex-1 min-w-0">
                      {isRtl ? entry.description_ar : entry.description_en}
                    </p>
                    <span
                      className={`font-mono font-bold text-sm shrink-0 ${
                        isDebit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formattedAmount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        {entries.length === 0 && !isLoading ? (
          <div className="text-center py-12 text-content-secondary">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">{t('emptyLedger')}</p>
          </div>
        ) : (
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-xs font-semibold text-content-secondary">
                <th className="py-3 px-4 text-start">{t('date')}</th>
                <th className="py-3 px-4 text-start">{t('description')}</th>
                <th className="py-3 px-4 text-start">{t('type')}</th>
                <th className="py-3 px-4 text-start">{t('amount')}</th>
                <th className="py-3 px-4 text-start">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-sm">
              {entries.map((entry) => {
                const isDebit = entry.entry_type === 'payout_debit';
                const formattedAmount = isDebit
                  ? `-$${(Math.abs(entry.amount_cents) / 100).toFixed(2)}`
                  : `+$${(Math.abs(entry.amount_cents) / 100).toFixed(2)}`;

                return (
                  <tr key={entry.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-mono text-content-secondary whitespace-nowrap">
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md truncate text-content-primary">
                      {isRtl ? entry.description_ar : entry.description_en}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getTypeBadge(entry.entry_type)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold">
                      <span className={isDebit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {formattedAmount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(entry.status)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-border-subtle mt-4">
          <div className="text-xs text-content-secondary">
            {isRtl
              ? `الصفحة ${pagination.current_page} من ${pagination.total_pages}`
              : `Page ${pagination.current_page} of ${pagination.total_pages}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-content-primary transition-all"
              type="button"
            >
              {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isRtl ? 'السابق' : 'Previous'}</span>
            </button>
            <button
              onClick={() => onPageChange(pagination.current_page + 1)}
              disabled={pagination.current_page >= pagination.total_pages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-content-primary transition-all"
              type="button"
            >
              <span>{isRtl ? 'التالي' : 'Next'}</span>
              {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
