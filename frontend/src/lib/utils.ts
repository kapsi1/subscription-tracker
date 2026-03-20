import type { Category } from '@subtracker/shared';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility functions for the SubTracker app
 */

/**
 * Find category color by name from categories list
 */
export function findCategoryColor(categories: Category[], name: string): string {
  return categories.find((c) => c.name === name)?.color ?? '#64748b';
}

/**
 * Find category icon by name from categories list
 */
export function findCategoryIcon(categories: Category[], name: string): string {
  return categories.find((c) => c.name === name)?.icon ?? 'Tag';
}

/**
 * Utility for merging tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  maximumFractionDigits = 2,
): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits,
    }).format(value);
  } catch (_e) {
    // Fallback for invalid currency codes
    return `${currency} ${(Number(value) || 0).toFixed(2)}`;
  }
}

/**
 * Format a date string
 */
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(
    'en-US',
    options || { month: 'short', day: 'numeric', year: 'numeric' },
  );
}

/**
 * Calculate days until a date
 */
export function daysUntil(dateString: string): number {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get inline style for a category badge from a hex color
 */
export function getCategoryStyle(
  hexColor: string,
  variant: 'default' | 'dashboard' = 'default',
): React.CSSProperties {
  const bgAlpha = variant === 'dashboard' ? '33' : '1a';
  const borderAlpha = variant === 'dashboard' ? '55' : '33';
  return {
    backgroundColor: `${hexColor}${bgAlpha}`,
    borderColor: `${hexColor}${borderAlpha}`,
  };
}
