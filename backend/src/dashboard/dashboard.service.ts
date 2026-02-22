import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingCycle, Subscription } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId, isActive: true },
    });

    let totalMonthlyCost = 0;
    let totalYearlyCost = 0;
    const categoryBreakdown: Record<string, number> = {};

    for (const sub of subscriptions) {
      const amount = Number(sub.amount);
      let monthlyEquivalent = 0;
      let yearlyEquivalent = 0;

      switch (sub.billingCycle) {
        case BillingCycle.monthly:
          monthlyEquivalent = amount;
          yearlyEquivalent = amount * 12;
          break;
        case BillingCycle.yearly:
          monthlyEquivalent = amount / 12;
          yearlyEquivalent = amount;
          break;
        case BillingCycle.custom:
          if (sub.intervalDays && sub.intervalDays > 0) {
            yearlyEquivalent = amount * (365 / sub.intervalDays);
            monthlyEquivalent = yearlyEquivalent / 12;
          }
          break;
      }

      totalMonthlyCost += monthlyEquivalent;
      totalYearlyCost += yearlyEquivalent;

      if (!categoryBreakdown[sub.category]) {
        categoryBreakdown[sub.category] = 0;
      }
      categoryBreakdown[sub.category] += monthlyEquivalent;
    }

    return {
      totalMonthlyCost,
      totalYearlyCost,
      activeSubscriptions: subscriptions.length,
      categoryBreakdown,
    };
  }

  async getForecast(userId: string, months: number = 12) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId, isActive: true },
    });

    const forecast = [];
    const now = new Date();
    
    // Create bucket for each upcoming month
    for (let i = 0; i < months; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      
      forecast.push({
        month: targetDate.toLocaleString('default', { month: 'short' }),
        year: targetDate.getFullYear(),
        cost: 0,
        currency: 'USD', // simplistic assumption for multi-currency
      });
    }

    // Go through each subscription and accurately step forward its next billing dates
    // to slot them into the correct forecast bucket.
    for (const sub of subscriptions) {
      const amount = Number(sub.amount);
      let currentBillingDate = new Date(sub.nextBillingDate);
      
      // Upper bound date
      const maxDate = new Date(now.getFullYear(), now.getMonth() + months, 1);
      
      // Prevent infinite loops internally on malformed custom intervals
      let loops = 0; 
      
      while (currentBillingDate < maxDate && loops < 1000) {
        loops++;
        
        // Find which bucket this billing date belongs to
        const yearDiff = currentBillingDate.getFullYear() - now.getFullYear();
        const monthDiff = currentBillingDate.getMonth() - now.getMonth();
        const index = yearDiff * 12 + monthDiff;

        // Ensure it falls within our forecast window, including the current partial month.
        if (index >= 0 && index < months) {
          forecast[index].cost += amount;
        }

        // Stepping to next billing date exactly like Subscriptions module logic
        if (sub.billingCycle === BillingCycle.monthly) {
          const m = currentBillingDate.getMonth();
          currentBillingDate.setMonth(m + 1);
          if (currentBillingDate.getMonth() !== (m + 1) % 12) {
            currentBillingDate.setDate(0);
          }
        } else if (sub.billingCycle === BillingCycle.yearly) {
          const y = currentBillingDate.getFullYear();
          const m = currentBillingDate.getMonth();
          const d = currentBillingDate.getDate();
          currentBillingDate.setFullYear(y + 1);
          if (m === 1 && d === 29 && currentBillingDate.getMonth() !== 1) {
            currentBillingDate.setDate(0);
          }
        } else if (sub.billingCycle === BillingCycle.custom && sub.intervalDays) {
          currentBillingDate.setDate(currentBillingDate.getDate() + sub.intervalDays);
        } else {
          // Fallback to prevent infinite loops if no clear cycle
          break;
        }
      }
    }

    return forecast;
  }
}
