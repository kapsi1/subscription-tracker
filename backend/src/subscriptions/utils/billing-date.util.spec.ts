import { BillingCycle } from '@prisma/client';
import { calculateNextBillingDate } from './billing-date.util';

describe('calculateNextBillingDate', () => {
  it('should correctly increment a simple monthly cycle', () => {
    const start = new Date(2025, 0, 15); // Jan 15, 2025
    const next = calculateNextBillingDate(BillingCycle.monthly, start);
    expect(next.getFullYear()).toBe(2025);
    expect(next.getMonth()).toBe(1); // Feb
    expect(next.getDate()).toBe(15);
  });

  it('should clamp monthly rollover (e.g., Jan 31 -> Feb 28)', () => {
    const start = new Date(2025, 0, 31); // Jan 31, 2025 (non-leap year)
    const next = calculateNextBillingDate(BillingCycle.monthly, start);
    expect(next.getFullYear()).toBe(2025);
    expect(next.getMonth()).toBe(1); // Feb
    expect(next.getDate()).toBe(28); // Clamped correctly
  });

  it('should clamp monthly rollover in a leap year (e.g., Jan 31 2024 -> Feb 29 2024)', () => {
    const start = new Date(2024, 0, 31); // Jan 31, 2024 (leap year)
    const next = calculateNextBillingDate(BillingCycle.monthly, start);
    expect(next.getFullYear()).toBe(2024);
    expect(next.getMonth()).toBe(1); // Feb
    expect(next.getDate()).toBe(29); // Clamped correctly
  });

  it('should correctly increment yearly cycle', () => {
    const start = new Date(2025, 5, 10);
    const next = calculateNextBillingDate(BillingCycle.yearly, start);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(5);
    expect(next.getDate()).toBe(10);
  });

  it('should fallback Feb 29 to Feb 28 next year on yearly cycle', () => {
    const start = new Date(2024, 1, 29); // Feb 29, 2024
    const next = calculateNextBillingDate(BillingCycle.yearly, start);
    expect(next.getFullYear()).toBe(2025);
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(28);
  });

  it('should increment custom days', () => {
    const start = new Date(2025, 0, 1);
    const next = calculateNextBillingDate(BillingCycle.custom, start, 40);
    expect(next.getFullYear()).toBe(2025);
    expect(next.getMonth()).toBe(1); // Feb
    expect(next.getDate()).toBe(10); // 40 days later
  });

  describe('billingDays custom cycle', () => {
    it('should find next day in the same month', () => {
      const start = new Date(2025, 0, 10); // Jan 10
      const next = calculateNextBillingDate(BillingCycle.custom, start, null, [5, 15, 25]);
      expect(next.getFullYear()).toBe(2025);
      expect(next.getMonth()).toBe(0); // Jan
      expect(next.getDate()).toBe(15);
    });

    it('should rollover to next month if no more days in current month', () => {
      const start = new Date(2025, 0, 26); // Jan 26
      const next = calculateNextBillingDate(BillingCycle.custom, start, null, [5, 15, 25]);
      expect(next.getFullYear()).toBe(2025);
      expect(next.getMonth()).toBe(1); // Feb
      expect(next.getDate()).toBe(5);
    });

    it('should handle year rollover', () => {
      const start = new Date(2025, 11, 26); // Dec 26
      const next = calculateNextBillingDate(BillingCycle.custom, start, null, [5, 15, 25]);
      expect(next.getFullYear()).toBe(2026);
      expect(next.getMonth()).toBe(0); // Jan
      expect(next.getDate()).toBe(5);
    });

    it('should clamp to last day of month if selected day does not exist', () => {
      const start = new Date(2025, 0, 1); // Jan 1
      const next = calculateNextBillingDate(BillingCycle.custom, start, null, [31]);
      // Jan has 31, so it should be Jan 31
      expect(next.getMonth()).toBe(0);
      expect(next.getDate()).toBe(31);

      // Now from Jan 31
      const nextNext = calculateNextBillingDate(BillingCycle.custom, next, null, [31]);
      // Feb does not have 31, so it should be Feb 28
      expect(nextNext.getMonth()).toBe(1);
      expect(nextNext.getDate()).toBe(28);
    });

    it('should respect shortageOffset and shortageDirection (before)', () => {
      // From Jan 31, billing on 31st
      const start = new Date(2025, 0, 31);
      const next = calculateNextBillingDate(
        BillingCycle.custom,
        start,
        null,
        [31],
        2, // 2 days before
        'before',
      );
      // Feb has 28. Jan 31 -> next month 31st (shortage).
      // 31 - 2 = 29. 29 > 28, so clamp to 28.
      expect(next.getMonth()).toBe(1); // Feb
      expect(next.getDate()).toBe(28);

      // April has 30. From Mar 31 -> next month 31st (shortage).
      const startMar = new Date(2025, 2, 31);
      const nextApr = calculateNextBillingDate(
        BillingCycle.custom,
        startMar,
        null,
        [31],
        2, // 2 days before
        'before',
      );
      // 31 - 2 = 29. 29 <= 30. So Apr 29.
      expect(nextApr.getMonth()).toBe(3); // April
      expect(nextApr.getDate()).toBe(29);
    });

    it('should respect shortageOffset and shortageDirection (after)', () => {
      // From Jan 31, billing on 30th
      const start = new Date(2025, 0, 31);
      const next = calculateNextBillingDate(
        BillingCycle.custom,
        start,
        null,
        [30],
        2, // 2 days after
        'after',
      );
      // Feb has 28. Jan 31 -> next month 30th (shortage).
      // 30 + 2 = 32. Feb 32 = Mar 4.
      expect(next.getMonth()).toBe(2); // March
      expect(next.getDate()).toBe(4);
    });

    it('should respect shortageOffset and shortageDirection (skip)', () => {
      // From Jan 31, billing on 31st
      const start = new Date(2025, 0, 31);
      const next = calculateNextBillingDate(BillingCycle.custom, start, null, [31], 0, 'skip');
      // Feb has 28. Jan 31 -> next month 31st (shortage).
      // skip means we skip February 31st entirely and look for the next valid 31st in the array,
      // which rolls over again until March 31st.
      expect(next.getMonth()).toBe(2); // March
      expect(next.getDate()).toBe(31);
    });
  });
});
