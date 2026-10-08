'use client';

import React from 'react';
import { useLocale } from 'next-intl';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const normalized = status.toLowerCase();

  let styles = 'bg-surface-elevated text-content-secondary border-border-subtle';
  let label = status;

  switch (normalized) {
    case 'upcoming':
      styles = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      label = isAr ? 'قادم' : 'Upcoming';
      break;
    case 'locked':
      styles = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      label = isAr ? 'مغلق للسحب' : 'Locked';
      break;
    case 'completed':
    case 'cleared':
    case 'valid':
    case 'active':
      styles = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      label =
        normalized === 'completed'
          ? isAr
            ? 'مكتمل'
            : 'Completed'
          : normalized === 'cleared'
          ? isAr
            ? 'تم التحويل'
            : 'Cleared'
          : normalized === 'valid'
          ? isAr
            ? 'سارٍ'
            : 'Valid'
          : isAr
          ? 'نشط'
          : 'Active';
      break;
    case 'available':
      styles = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      label = isAr ? 'متاح للسحب' : 'Available';
      break;
    case 'pending':
    case 'requested':
    case 'processing':
      styles = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      label =
        normalized === 'requested'
          ? isAr
            ? 'مطلوب'
            : 'Requested'
          : normalized === 'processing'
          ? isAr
            ? 'قيد المعالجة'
            : 'Processing'
          : isAr
          ? 'قيد الانتظار'
          : 'Pending';
      break;
    case 'rejected':
    case 'cancelled':
    case 'revoked':
    case 'suspended':
      styles = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      label =
        normalized === 'rejected'
          ? isAr
            ? 'مرفوض'
            : 'Rejected'
          : normalized === 'cancelled'
          ? isAr
            ? 'ملغى'
            : 'Cancelled'
          : normalized === 'revoked'
          ? isAr
            ? 'مسحوب / ملغى'
            : 'Revoked'
          : isAr
          ? 'معطل'
          : 'Suspended';
      break;
    case 'superseded':
      styles = 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
      label = isAr ? 'مستبدل' : 'Superseded';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles} ${className}`}
    >
      {label}
    </span>
  );
}
