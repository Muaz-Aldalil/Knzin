import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standard utility function to merge Tailwind classes deterministically.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
