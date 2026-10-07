import React from 'react';
import { cn } from '@/lib/utils';
import {
  Ticket,
  Video,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Trophy,
} from 'lucide-react';

export type BadgeVariant =
  | 'default'
  | 'video'
  | 'lesson'
  | 'popular'
  | 'ticket'
  | 'success'
  | 'outline'
  | 'accent'
  | 'destructive'
  | 'error'
  | 'warning'
  | 'winner';

export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'text-primary font-bold',
  video: 'text-primary font-medium',
  lesson: 'text-content-secondary dark:text-content-secondary font-medium',
  outline: 'text-content-muted dark:text-content-muted font-medium',
  popular: 'text-amber-600 dark:text-amber-400 font-bold',
  ticket: 'text-accent font-bold',
  accent: 'text-accent font-bold',
  success: 'text-success font-bold',
  destructive: 'text-destructive font-bold',
  error: 'text-destructive font-bold',
  warning: 'text-amber-600 dark:text-amber-400 font-bold',
  winner: 'text-amber-600 dark:text-amber-400 font-bold',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[11px] gap-1',
  md: 'text-xs gap-1.5',
  lg: 'text-sm font-semibold gap-1.5',
};

const defaultIcons: Partial<Record<BadgeVariant, React.ReactNode>> = {
  video: <Video className="w-3.5 h-3.5 text-current shrink-0" />,
  lesson: <BookOpen className="w-3.5 h-3.5 text-current shrink-0" />,
  popular: <Sparkles className="w-3.5 h-3.5 text-current shrink-0" />,
  ticket: <Ticket className="w-3.5 h-3.5 text-current shrink-0" />,
  accent: <Sparkles className="w-3.5 h-3.5 text-current shrink-0" />,
  success: <CheckCircle2 className="w-3.5 h-3.5 text-current shrink-0" />,
  destructive: <AlertCircle className="w-3.5 h-3.5 text-current shrink-0" />,
  error: <AlertCircle className="w-3.5 h-3.5 text-current shrink-0" />,
  warning: <AlertTriangle className="w-3.5 h-3.5 text-current shrink-0" />,
  winner: <Trophy className="w-3.5 h-3.5 text-current shrink-0" />,
};

export function Badge({
  variant = 'lesson',
  size = 'md',
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  const chosenIcon = icon !== undefined ? icon : defaultIcons[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center select-none bg-transparent border-0 p-0',
        variantStyles[variant] || 'text-content-muted font-medium',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {chosenIcon}
      <span>{children}</span>
    </span>
  );
}
