import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  value,
  label,
  showPercentage = false,
  size = 'md',
  className,
  ...props
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full space-y-1.5', className)} {...props}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label && <span>{label}</span>}
          {showPercentage && <span className="font-mono">{Math.round(clampedValue)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'تقدم الدورة'}
        className={cn(
          'w-full bg-slate-200/90 dark:bg-slate-800 rounded-full overflow-hidden',
          heightClasses[size]
        )}
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
