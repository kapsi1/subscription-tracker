import { describe, expect, it } from 'vitest';
import { daysUntil, formatCurrency, formatDate } from './utils';

import i18n from './i18n';

describe('formatCurrency', () => {
  it('should format USD correctly', () => {
    expect(formatCurrency(15.99, 'USD')).toBe('$15.99');
  });

  it('should format EUR correctly', () => {
    expect(formatCurrency(10, 'EUR')).toBe('€10');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('should default to USD', () => {
    expect(formatCurrency(100)).toBe('$100');
  });

  it('should format large numbers with commas in English', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('should format numbers with NBSP and comma in Polish', async () => {
    const currentLang = i18n.language;
    await i18n.changeLanguage('pl');
    try {
      const result = formatCurrency(12345.67, 'PLN');
      // Polish uses NBSP (160) as group separator and comma as decimal separator
      // Note: result might be "12 345,67 zł" or "12.345,67 PLN" depending on environment
      // but according to our test earlier it should be "12 345,67 zł"
      expect(result).toContain(',');
      expect(result).toContain('\xa0');
      // Normalize spaces for comparison if needed, but the requirement specifically asked for NBSP
      expect(result.charCodeAt(result.indexOf(',') - 4)).toBe(160);
    } finally {
      await i18n.changeLanguage(currentLang);
    }
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
