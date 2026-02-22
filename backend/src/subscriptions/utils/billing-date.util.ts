import { BillingCycle } from '@prisma/client';

export function calculateNextBillingDate(
  billingCycle: BillingCycle,
  startDate: Date = new Date(),
  intervalDays?: number | null
): Date {
  const nextDate = new Date(startDate);
  
  if (billingCycle === BillingCycle.monthly) {
    const currentMonth = nextDate.getMonth();
    const currentDay = nextDate.getDate();
    
    // Increment month
    nextDate.setMonth(currentMonth + 1);
    
    // Month rollover check (e.g., Jan 31 -> Feb 31 -> Mar 3)
    // If the month jumped more than 1 (or wrapped to next year differently), 
    // it means the target month didn't have enough days.
    // Clamp to the last day of the intended month.
    const expectedMonth = (currentMonth + 1) % 12;
    if (nextDate.getMonth() !== expectedMonth) {
      nextDate.setDate(0); // Sets to the last day of the previous calendar month
    }
  } else if (billingCycle === BillingCycle.yearly) {
    const currentYear = nextDate.getFullYear();
    const currentMonth = nextDate.getMonth();
    const currentDay = nextDate.getDate();
    
    nextDate.setFullYear(currentYear + 1);

    // Leap year check (e.g., Feb 29 -> non-leap year Feb 29 -> Mar 1)
    if (currentMonth === 1 && currentDay === 29 && nextDate.getMonth() !== 1) {
      nextDate.setDate(0);
    }
  } else if (billingCycle === BillingCycle.custom && intervalDays) {
    nextDate.setDate(nextDate.getDate() + intervalDays);
  }

  return nextDate;
}
