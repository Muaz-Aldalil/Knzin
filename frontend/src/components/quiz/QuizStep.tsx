'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface QuizOption {
  id: string;
  label: string;
}

interface QuizStepProps {
  question: string;
  options: QuizOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export default function QuizStep({
  question,
  options,
  selectedValue,
  onSelect,
}: QuizStepProps) {
  return (
    <div className="space-y-3.5 text-start">
      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
        {question}
      </h4>

      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selectedValue === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`w-full text-start p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                isSelected
                  ? 'border-primary bg-primary-light/70 dark:bg-blue-950/40 text-primary dark:text-blue-200 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="leading-snug">{option.label}</span>
              {isSelected ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
