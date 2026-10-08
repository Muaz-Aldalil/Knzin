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

  let styles = 'text-content-secondary';
  let label = status;

  switch (normalized) {
    case 'upcoming':
      styles = 'text-amber-500';
      label = isAr ? 'قادم' : 'Upcoming';
      break;
    case 'locked':
      styles = 'text-indigo-500 dark:text-indigo-400';
      label = isAr ? 'مغلق للسحب' : 'Locked';
      break;
    case 'completed':
    case 'cleared':
    case 'valid':
    case 'active':
      styles = 'text-emerald-600 dark:text-emerald-400';
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
      styles = 'text-blue-600 dark:text-blue-400';
      label = isAr ? 'متاح للسحب' : 'Available';
      break;
    case 'pending':
    case 'requested':
    case 'processing':
      styles = 'text-amber-600 dark:text-amber-400';
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
      styles = 'text-rose-600 dark:text-rose-400';
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
      styles = 'text-slate-500 dark:text-slate-400';
      label = isAr ? 'مستبدل' : 'Superseded';
      break;
  }

  return (
    <span
      className={`inline-flex items-center text-xs font-bold ${styles} ${className}`}
    >
      {label}
    </span>
  );
}
