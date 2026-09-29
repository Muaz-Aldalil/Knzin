'use client';

import React from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export const CANONICAL_LEGAL_SHIELD = "أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل";

interface LegalShieldCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | null;
}

export default function LegalShieldCheckbox({
  checked,
  onChange,
  error,
}: LegalShieldCheckboxProps) {
  return (
    <div className={`p-4 rounded-xl border transition-colors ${
      error
        ? 'border-red-500/80 bg-red-50/50 dark:bg-red-950/20'
        : checked
        ? 'border-primary/60 bg-primary-light/40 dark:bg-blue-950/20'
        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
    }`}>
      <label
        htmlFor="legal_terms_agreed"
        className="flex items-start gap-3 cursor-pointer select-none text-start"
      >
        <div className="flex items-center h-5 mt-0.5">
          <input
            id="legal_terms_agreed"
            name="legal_terms_agreed"
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            required
            aria-required="true"
            className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary focus:ring-2 cursor-pointer"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>إقرار قانوني صريح وإخلاء مسؤولية</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            {CANONICAL_LEGAL_SHIELD}
          </p>
        </div>
      </label>

      {error && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
