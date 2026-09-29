'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'md' | 'lg';
  showKbdHint?: boolean;
  onKbdClick?: () => void;
}

export function SearchInput({
  size = 'md',
  showKbdHint = true,
  onKbdClick,
  className,
  placeholder = 'ابحث عن المهارات المهنية، الدروس، أو أرقام الأجزاء...',
  ...props
}: SearchInputProps) {
  const isLarge = size === 'lg';

  return (
    <div className={cn('relative w-full group', className)}>
      <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
        <Search className={cn(isLarge ? 'w-5 h-5' : 'w-4 h-4')} />
      </div>

      <input
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          'w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
          isLarge
            ? 'h-14 sm:h-16 ps-12 pe-20 text-sm sm:text-base font-medium'
            : 'h-11 sm:h-12 ps-10 pe-16 text-xs sm:text-sm font-normal'
        )}
        {...props}
      />

      {showKbdHint && (
        <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
          <kbd
            onClick={onKbdClick}
            className="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-mono font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xs select-none"
          >
            <span className="text-xs">⌘</span>
            <span>K</span>
          </kbd>
        </div>
      )}
    </div>
  );
}
