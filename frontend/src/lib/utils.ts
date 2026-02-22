/**
 * Utility functions for the Subscription Cost Tracker app
 */

/**
 * Format a number as currency
 */
export function formatCurrency(value: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(value);
}

/**
 * Format a date string
 */
export function formatDate(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(
    "en-US",
    options || { month: "short", day: "numeric", year: "numeric" }
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
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Entertainment: "bg-purple-100 text-purple-700 border-purple-200",
    Productivity: "bg-blue-100 text-blue-700 border-blue-200",
    "Cloud Services": "bg-cyan-100 text-cyan-700 border-cyan-200",
    Development: "bg-green-100 text-green-700 border-green-200",
    Professional: "bg-orange-100 text-orange-700 border-orange-200",
    "Health & Fitness": "bg-pink-100 text-pink-700 border-pink-200",
    Education: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Other: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return colors[category] || colors.Other;
}
