'use client';

import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

export const PERSONALIZATION_STAMP_TEXT = "تم تخصيص هذه النسخة المبرمجة حصرياً لبياناتك";

interface PersonalizationBadgeProps {
  email?: string;
  className?: string;
}

export default function PersonalizationBadge({
  email,
  className = '',
}: PersonalizationBadgeProps) {
  return (
    <div
      className={`p-3 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-medium ${className}`}
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="font-bold text-slate-900 dark:text-white">
          {PERSONALIZATION_STAMP_TEXT}
        </span>
      </div>

      {email && (
        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
          <Lock className="w-3 h-3 text-slate-400" />
          <span className="max-w-[140px] truncate">{email}</span>
        </div>
      )}
    </div>
  );
}
