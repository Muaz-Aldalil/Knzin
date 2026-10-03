'use client';

import React from 'react';
import { formatUsd } from '@/lib/admin/format';

interface MoneyTextProps {
  cents: number;
  className?: string;
  showSign?: boolean;
}

export function MoneyText({ cents, className = '', showSign = false }: MoneyTextProps) {
  const isPositive = cents > 0;
  const isNegative = cents < 0;

  const formatted = formatUsd(Math.abs(cents));
  const sign = showSign ? (isPositive ? '+' : isNegative ? '-' : '') : isNegative ? '-' : '';

  return (
    <span
      className={`font-mono font-semibold tracking-tight ${
        showSign
          ? isPositive
            ? 'text-emerald-400'
            : isNegative
            ? 'text-rose-400'
            : 'text-content-primary'
          : 'text-content-primary'
      } ${className}`}
    >
      {sign}
      {formatted}
    </span>
  );
}
