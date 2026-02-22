import { calculateNextBillingDate } from './billing-date.util';
import { BillingCycle } from '@prisma/client';

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
});
