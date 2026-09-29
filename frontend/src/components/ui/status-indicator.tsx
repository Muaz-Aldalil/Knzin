import React from 'react';
import { cn } from '@/lib/utils';
import { Play, CheckCircle2, CircleDashed, Lock } from 'lucide-react';

export type StatusType = 'now-playing' | 'completed' | 'in-progress' | 'locked';

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType;
  label?: string;
  showIconOnly?: boolean;
}

const statusConfig: Record<
  StatusType,
  {
    icon: React.ReactNode;
    defaultLabelAr: string;
    containerClass: string;
    textClass: string;
  }
> = {
  'now-playing': {
    icon: <Play className="w-3.5 h-3.5 fill-current shrink-0" />,
    defaultLabelAr: 'قيد التشغيل الآن',
    containerClass: 'bg-primary-light/80 text-primary border-primary/30',
    textClass: 'text-primary font-bold',
  },
  completed: {
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />,
    defaultLabelAr: 'مكتمل بنجاح',
    containerClass: 'bg-success-light/80 text-success border-success/30',
    textClass: 'text-success font-bold',
  },
  'in-progress': {
    icon: <CircleDashed className="w-3.5 h-3.5 text-accent-hover dark:text-accent animate-spin-slow shrink-0" />,
    defaultLabelAr: 'قيد التعلم',
    containerClass: 'bg-accent/10 text-amber-800 dark:text-accent border-accent/30',
    textClass: 'text-amber-800 dark:text-accent font-bold',
  },
  locked: {
    icon: <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
    defaultLabelAr: 'مغلق (يتطلب الشراء)',
    containerClass: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
    textClass: 'text-slate-500 font-medium',
  },
};

export function StatusIndicator({
  status,
  label,
  showIconOnly = false,
  className,
  ...props
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabelAr;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border select-none',
        config.containerClass,
        className
      )}
      {...props}
    >
      {config.icon}
      {!showIconOnly && <span className={config.textClass}>{displayLabel}</span>}
    </div>
  );
}
