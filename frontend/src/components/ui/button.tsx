'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary hover:bg-primary-hover text-white shadow-sm shadow-primary/25 border border-primary active:scale-[0.98]',
  secondary:
    'bg-secondary hover:bg-secondary-surface text-white border border-secondary-surface active:scale-[0.98]',
  accent:
    'bg-accent hover:bg-accent-hover text-slate-950 font-black shadow-sm shadow-accent/25 border border-accent active:scale-[0.98]',
  outline:
    'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98]',
  text:
    'bg-transparent hover:bg-primary-light/60 dark:hover:bg-primary/10 text-primary font-bold border border-transparent',
};

export const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-11 px-4 text-xs sm:text-sm font-bold rounded-xl gap-2 min-h-[44px]',
  lg: 'h-12 sm:h-13 px-6 text-sm sm:text-base font-bold rounded-xl gap-2.5 min-h-[48px]',
  xl: 'h-14 sm:h-16 px-8 text-base sm:text-lg font-black rounded-2xl gap-3 min-h-[56px]',
};

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps
  extends BaseButtonProps,
    React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: undefined;
}

export interface ButtonLinkProps
  extends BaseButtonProps,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        baseClasses,
        buttonVariantClasses[variant],
        buttonSizeClasses[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 select-none cursor-pointer';

  return (
    <Link
      href={href}
      className={cn(
        baseClasses,
        buttonVariantClasses[variant],
        buttonSizeClasses[size],
        className
      )}
      {...props}
    >
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </Link>
  );
}
