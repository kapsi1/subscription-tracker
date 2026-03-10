/**
 * Utility functions for the Subscription Cost Tracker app
 */

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
 * Get category badge color classes
 */
export function getCategoryColor(
  category: string,
  variant: 'default' | 'dashboard' = 'default',
): string {
  const isDashboard = variant === 'dashboard';

  // Explicit mappings to ensure Tailwind picks up the classes
  const colorMap: Record<string, string> = {
    Entertainment: 'purple',
    Productivity: 'blue',
    'Cloud Services': 'cyan',
    Development: 'green',
    Professional: 'orange',
    Health: 'rose',
    'Health & Fitness': 'rose',
    Housing: 'amber',
    Utilities: 'indigo',
    Services: 'teal',
    Education: 'yellow',
    Other: 'slate',
  };

  const color = colorMap[category] || colorMap.Other;

  // Use explicit class names to avoid dynamic generation issues
  const classes: Record<string, { default: string; dashboard: string }> = {
    purple: {
      default:
        'bg-purple-500/10 border-purple-500/20 dark:bg-purple-500/15 dark:border-purple-500/25',
      dashboard:
        'bg-purple-500/20 border-purple-500/25 dark:bg-purple-500/25 dark:border-purple-500/35',
    },
    blue: {
      default: 'bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/15 dark:border-blue-500/25',
      dashboard: 'bg-blue-500/20 border-blue-500/25 dark:bg-blue-500/25 dark:border-blue-500/35',
    },
    cyan: {
      default: 'bg-cyan-500/10 border-cyan-500/20 dark:bg-cyan-500/15 dark:border-cyan-500/25',
      dashboard: 'bg-cyan-500/20 border-cyan-500/25 dark:bg-cyan-500/25 dark:border-cyan-500/35',
    },
    green: {
      default: 'bg-green-500/10 border-green-500/20 dark:bg-green-500/15 dark:border-green-500/25',
      dashboard:
        'bg-green-500/20 border-green-500/25 dark:bg-green-500/25 dark:border-green-500/35',
    },
    orange: {
      default:
        'bg-orange-500/10 border-orange-500/20 dark:bg-orange-500/15 dark:border-orange-500/25',
      dashboard:
        'bg-orange-500/20 border-orange-500/25 dark:bg-orange-500/25 dark:border-orange-500/35',
    },
    rose: {
      default: 'bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/15 dark:border-rose-500/25',
      dashboard: 'bg-rose-500/20 border-rose-500/25 dark:bg-rose-500/25 dark:border-rose-500/35',
    },
    amber: {
      default: 'bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/15 dark:border-amber-500/25',
      dashboard:
        'bg-amber-500/20 border-amber-500/25 dark:bg-amber-500/25 dark:border-amber-500/35',
    },
    indigo: {
      default:
        'bg-indigo-500/10 border-indigo-500/20 dark:bg-indigo-500/15 dark:border-indigo-500/25',
      dashboard:
        'bg-indigo-500/20 border-indigo-500/25 dark:bg-indigo-500/25 dark:border-indigo-500/35',
    },
    teal: {
      default: 'bg-teal-500/10 border-teal-500/20 dark:bg-teal-500/15 dark:border-teal-500/25',
      dashboard: 'bg-teal-500/20 border-teal-500/25 dark:bg-teal-500/25 dark:border-teal-500/35',
    },
    yellow: {
      default:
        'bg-yellow-500/10 border-yellow-500/20 dark:bg-yellow-500/15 dark:border-yellow-500/25',
      dashboard:
        'bg-yellow-500/20 border-yellow-500/25 dark:bg-yellow-500/25 dark:border-yellow-500/35',
    },
    slate: {
      default: 'bg-slate-500/10 border-slate-500/20 dark:bg-slate-500/15 dark:border-slate-500/25',
      dashboard:
        'bg-slate-500/20 border-slate-500/25 dark:bg-slate-500/25 dark:border-slate-500/35',
    },
  };

  const selectedClasses = classes[color] || classes.slate;
  const baseClasses = isDashboard ? selectedClasses.dashboard : selectedClasses.default;

  return `${baseClasses} text-foreground`;
}
