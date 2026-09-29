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
      className={`p-3 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium ${className}`}
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-success shrink-0" />
        <span className="font-bold text-secondary dark:text-white leading-relaxed break-words">
          {PERSONALIZATION_STAMP_TEXT}
        </span>
      </div>

      {email && (
        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono self-start sm:self-auto">
          <Lock className="w-3 h-3 text-slate-400" />
          <span className="max-w-[140px] truncate">{email}</span>
        </div>
      )}
    </div>
  );
}
