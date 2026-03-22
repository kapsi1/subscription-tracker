import { BillingCycle } from '@prisma/client';

export function calculateNextBillingDate(
  billingCycle: BillingCycle,
  startDate: Date = new Date(),
  intervalDays?: number | null,
  billingDays?: number[] | null,
  shortageOffset: number = 0,
  shortageDirection: 'before' | 'after' | 'skip' = 'before',
): Date {
  const nextDate = new Date(startDate);

  if (billingCycle === BillingCycle.monthly) {
    const currentMonth = nextDate.getMonth();
    nextDate.setMonth(currentMonth + 1);

    const expectedMonth = (currentMonth + 1) % 12;
    if (nextDate.getMonth() !== expectedMonth) {
      nextDate.setDate(0);
    }
  } else if (billingCycle === BillingCycle.yearly) {
    const currentYear = nextDate.getFullYear();
    const currentMonth = nextDate.getMonth();
    const currentDay = nextDate.getDate();

    nextDate.setFullYear(currentYear + 1);

    if (currentMonth === 1 && currentDay === 29 && nextDate.getMonth() !== 1) {
      nextDate.setDate(0);
    }
  } else if (billingCycle === BillingCycle.custom) {
    if (billingDays && billingDays.length > 0) {
      const sortedDays = [...billingDays].sort((a, b) => a - b);
      const currentDay = nextDate.getDate();
      const currentMonth = nextDate.getMonth();

      // Find first day in sortedDays that is strictly greater than currentDay
      const nextDay = sortedDays.find((day) => day > currentDay);

      if (nextDay) {
        nextDate.setDate(nextDay);
        // Handle month shortage
        if (nextDate.getMonth() !== currentMonth) {
          if (shortageDirection === 'skip') {
            return calculateNextBillingDate(
              billingCycle,
              nextDate,
              intervalDays,
              billingDays,
              shortageOffset,
              shortageDirection,
            );
          }
          const targetDay =
            shortageDirection === 'before' ? nextDay - shortageOffset : nextDay + shortageOffset;
          nextDate.setFullYear(nextDate.getFullYear(), currentMonth, targetDay);

          // Final safety clamp for 'before' to stay in the intended month
          if (shortageDirection === 'before' && nextDate.getMonth() !== currentMonth) {
            nextDate.setDate(0);
          }
        }
      } else {
        // Next month, first day in sortedDays
        const nextMonth = (currentMonth + 1) % 12;
        const nextYear = nextMonth === 0 ? nextDate.getFullYear() + 1 : nextDate.getFullYear();

        nextDate.setFullYear(nextYear, nextMonth, sortedDays[0]);

        // Handle month shortage
        if (nextDate.getMonth() !== nextMonth) {
          if (shortageDirection === 'skip') {
            return calculateNextBillingDate(
              billingCycle,
              nextDate,
              intervalDays,
              billingDays,
              shortageOffset,
              shortageDirection,
            );
          }
          const targetDay =
            shortageDirection === 'before'
              ? sortedDays[0] - shortageOffset
              : sortedDays[0] + shortageOffset;
          nextDate.setFullYear(nextYear, nextMonth, targetDay);

          if (shortageDirection === 'before' && nextDate.getMonth() !== nextMonth) {
            nextDate.setDate(0);
          }
        }
      }
    } else if (intervalDays) {
      nextDate.setDate(nextDate.getDate() + intervalDays);
    }
  }

  return nextDate;
}
