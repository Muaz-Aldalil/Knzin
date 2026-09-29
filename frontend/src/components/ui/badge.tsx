import React from 'react';
import { cn } from '@/lib/utils';
import { Ticket, Video, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';

export type BadgeVariant = 'video' | 'lesson' | 'popular' | 'ticket' | 'success' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  video: 'bg-primary-light/80 dark:bg-primary/10 text-primary border-primary/20',
  lesson: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  popular: 'bg-accent/15 text-amber-800 dark:text-accent border-accent/30 font-black',
  ticket: 'bg-accent/10 text-accent border-accent/25 font-black',
  success: 'bg-success-light/80 dark:bg-success/10 text-success border-success/25 font-bold',
  outline: 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400',
};

const defaultIcons: Partial<Record<BadgeVariant, React.ReactNode>> = {
  video: <Video className="w-3 h-3 text-current shrink-0" />,
  lesson: <BookOpen className="w-3 h-3 text-current shrink-0" />,
  popular: <Sparkles className="w-3 h-3 text-current shrink-0" />,
  ticket: <Ticket className="w-3 h-3 text-current shrink-0" />,
  success: <CheckCircle2 className="w-3 h-3 text-current shrink-0" />,
};

export function Badge({
  variant = 'lesson',
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  const chosenIcon = icon !== undefined ? icon : defaultIcons[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border tracking-wide select-none',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {chosenIcon}
      <span>{children}</span>
    </span>
  );
}
