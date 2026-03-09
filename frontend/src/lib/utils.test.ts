import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, daysUntil, getCategoryColor } from './utils';

describe('formatCurrency', () => {
  it('should format USD correctly', () => {
    expect(formatCurrency(15.99, 'USD')).toBe('$15.99');
  });

  it('should format EUR correctly', () => {
    expect(formatCurrency(10, 'EUR')).toBe('€10.00');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should default to USD', () => {
    expect(formatCurrency(100)).toBe('$100.00');
  });

  it('should format large numbers with commas', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });
});

describe('formatDate', () => {
  it('should format a date string with default options', () => {
    const result = formatDate('2025-03-15T00:00:00.000Z');
    // Default: month short, day numeric, year numeric
    expect(result).toContain('Mar');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  it('should accept custom date format options', () => {
    const result = formatDate('2025-06-01', { month: 'long', year: 'numeric' });
    expect(result).toContain('June');
    expect(result).toContain('2025');
  });
});

describe('daysUntil', () => {
  it('should return positive number for future dates', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const result = daysUntil(futureDate.toISOString());
    expect(result).toBeGreaterThanOrEqual(9);
    expect(result).toBeLessThanOrEqual(11);
  });

  it('should return negative number for past dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const result = daysUntil(pastDate.toISOString());
    expect(result).toBeLessThanOrEqual(-4);
    expect(result).toBeGreaterThanOrEqual(-6);
  });

  it('should return 0 or 1 for today', () => {
    const today = new Date().toISOString();
    const result = daysUntil(today);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});

describe('getCategoryColor', () => {
  it('should return correct classes for Entertainment', () => {
    const result = getCategoryColor('Entertainment');
    expect(result).toContain('purple');
  });

  it('should return correct classes for Productivity', () => {
    const result = getCategoryColor('Productivity');
    expect(result).toContain('blue');
  });

  it('should return correct classes for Cloud Services', () => {
    const result = getCategoryColor('Cloud Services');
    expect(result).toContain('cyan');
  });

  it('should return default gray classes for unknown categories', () => {
    const result = getCategoryColor('SomeRandomCategory');
    expect(result).toContain('slate');
  });
});
