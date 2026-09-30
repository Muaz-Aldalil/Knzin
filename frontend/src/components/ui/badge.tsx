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

/**
 * Normal/informational badges:
 * Visual source of truth: lesson cards on the main page (CourseCard metadata row).
 * - No badge background (bg-transparent)
 * - No badge border (border-0)
 * - No pill container padding (p-0)
 * - Lightweight typography and spacing
 * - Icon sits directly with text with text-current
 */
const isOrdinaryVariant = (variant: BadgeVariant): boolean => {
  return variant === 'video' || variant === 'lesson' || variant === 'outline';
};

const ordinaryVariantStyles: Record<string, string> = {
  video: 'text-primary font-medium',
  lesson: 'text-content-secondary dark:text-content-secondary font-medium',
  outline: 'text-content-muted dark:text-content-muted font-medium',
};

const ordinarySizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[11px] gap-1',
  md: 'text-xs gap-1.5',
  lg: 'text-sm font-semibold gap-1.5',
};

/**
 * Important semantic badges:
 * Intentionally emphasized on the badge container:
 * - Winner, Error, Destructive, Success, Important Warnings, Ticket/Promotional status
 * - Icon sits directly inside without any nested box or border around the icon
 */
const emphasizedVariantStyles: Record<string, string> = {
  default: 'bg-primary text-white border border-primary/20 font-bold',
  popular: 'bg-accent/15 text-amber-900 dark:text-accent border border-accent/30 font-black',
  ticket: 'bg-accent/10 text-accent border border-accent/25 font-bold',
  accent: 'bg-accent/15 text-amber-950 dark:text-accent border border-accent/40 font-black',
  success: 'bg-success-light/80 dark:bg-success/15 text-success border border-success/30 font-bold',
  destructive: 'bg-destructive/10 text-destructive border border-destructive/25 font-bold',
  error: 'bg-destructive/10 text-destructive border border-destructive/25 font-bold',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold',
  winner: 'bg-amber-500 text-amber-950 border border-amber-600/30 font-bold shadow-xs',
};

const emphasizedSizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-0.5 text-xs gap-1.5',
  lg: 'px-3 py-1 text-sm font-bold gap-1.5',
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
  const isOrdinary = isOrdinaryVariant(variant);

  return (
    <span
      className={cn(
        'inline-flex items-center select-none',
        isOrdinary
          ? cn(
              'bg-transparent border-0 p-0',
              ordinaryVariantStyles[variant] || 'text-content-muted font-medium',
              ordinarySizeStyles[size]
            )
          : cn(
              'rounded-full border tracking-wide',
              emphasizedVariantStyles[variant] || emphasizedVariantStyles.default,
              emphasizedSizeStyles[size]
            ),
        className
      )}
      {...props}
    >
      {chosenIcon}
      <span>{children}</span>
    </span>
  );
}
