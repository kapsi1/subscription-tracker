import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingCycle, Subscription } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private incrementBillingDate(subscription: Subscription, billingDate: Date) {
    if (subscription.billingCycle === BillingCycle.monthly) {
      this.addMonthsClamped(billingDate, 1);
    } else if (subscription.billingCycle === BillingCycle.yearly) {
      this.addYearsClamped(billingDate, 1);
    } else if (
      subscription.billingCycle === BillingCycle.custom &&
      subscription.intervalDays
    ) {
      billingDate.setDate(billingDate.getDate() + subscription.intervalDays);
    } else {
      throw new Error('Invalid billing cycle configuration');
    }
  }

  private addMonthsClamped(date: Date, months: number) {
    const m = date.getMonth();
    date.setMonth(m + months);
    if (date.getMonth() !== (m + months) % 12) {
      date.setDate(0);
    }
  }

  private addYearsClamped(date: Date, years: number) {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    date.setFullYear(y + years);
    if (m === 1 && d === 29 && date.getMonth() !== 1) {
      date.setDate(0);
    }
  }

  private calculateUpcomingAmountInRange(
    subscriptions: Subscription[],
    rangeStart: Date,
    rangeEnd: Date,
  ) {
    let total = 0;

    for (const sub of subscriptions) {
      const amount = Number(sub.amount);
      const billingDate = new Date(sub.nextBillingDate);
      let loops = 0;

      while (billingDate < rangeEnd && loops < 1000) {
        loops++;

        if (billingDate >= rangeStart) {
          total += amount;
        }

        if (sub.billingCycle === BillingCycle.monthly) {
          this.addMonthsClamped(billingDate, 1);
        } else if (sub.billingCycle === BillingCycle.yearly) {
          this.addYearsClamped(billingDate, 1);
        } else if (sub.billingCycle === BillingCycle.custom && sub.intervalDays) {
          billingDate.setDate(billingDate.getDate() + sub.intervalDays);
        } else {
          break;
        }
      }
    }

    return total;
  }

  calculateCosts(subscriptions: Subscription[]) {
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

  async getSummary(userId: string, month?: number, year?: number) {
    const now = new Date();
    const queryYear = year !== undefined ? Number(year) : now.getFullYear();
    const queryMonth = month !== undefined ? Number(month) : now.getMonth();

    const yearStart = new Date(queryYear, 0, 1);
    const nextYearStart = new Date(queryYear + 1, 0, 1);

    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId, isActive: true },
    });

    const paymentsInMonth = await this.getMonthlyPayments(
      userId,
      queryMonth,
      queryYear,
    );

    let totalMonthlyCost = 0;
    const categoryBreakdown: Record<string, number> = {};

    for (const p of paymentsInMonth) {
      totalMonthlyCost += p.amount;
      if (!categoryBreakdown[p.category]) {
        categoryBreakdown[p.category] = 0;
      }
      categoryBreakdown[p.category] += p.amount;
    }

    const [paidThisYear] = await Promise.all([
      this.prisma.paymentHistory.aggregate({
        where: {
          paidAt: {
            gte: yearStart,
            lt: nextYearStart,
          },
          subscription: {
            userId,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    let upcomingThisYear = 0;
    if (queryYear >= now.getFullYear()) {
      const startForUpcoming =
        queryYear === now.getFullYear() ? now : yearStart;
      upcomingThisYear = this.calculateUpcomingAmountInRange(
        subscriptions,
        startForUpcoming,
        nextYearStart,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true },
    });

    return {
      totalMonthlyCost,
      totalYearlyCost: Number(paidThisYear._sum.amount ?? 0) + upcomingThisYear,
      activeSubscriptions: subscriptions.length,
      categoryBreakdown,
      currency: user?.currency || 'USD',
    };
  }

  async getMonthlyPayments(userId: string, month?: number, year?: number) {
    const now = new Date();
    const queryYear = year !== undefined ? Number(year) : now.getFullYear();
    const queryMonth = month !== undefined ? Number(month) : now.getMonth();

    const monthStart = new Date(queryYear, queryMonth, 1);
    const nextMonthStart = new Date(queryYear, queryMonth + 1, 1);

    const [paidPayments, subscriptions] = await Promise.all([
      this.prisma.paymentHistory.findMany({
        where: {
          paidAt: {
            gte: monthStart,
            lt: nextMonthStart,
          },
          subscription: {
            userId,
          },
        },
        include: {
          subscription: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
        orderBy: {
          paidAt: 'asc',
        },
      }),
      this.prisma.subscription.findMany({
        where: {
          userId,
          isActive: true,
        },
      }),
    ]);

    const paidKey = (subscriptionId: string, date: Date) =>
      `${subscriptionId}:${date.toISOString().slice(0, 10)}`;

    const paidPaymentKeys = new Set(
      paidPayments.map((payment) => paidKey(payment.subscriptionId, payment.paidAt)),
    );

    const completedItems = paidPayments.map((payment) => ({
      id: payment.id,
      subscriptionId: payment.subscriptionId,
      name: payment.subscription.name,
      category: payment.subscription.category,
      amount: Number(payment.amount),
      currency: payment.currency,
      date: payment.paidAt,
      status: 'done' as const,
    }));

    const upcomingItems: Array<{
      id: string;
      subscriptionId: string;
      name: string;
      category: string;
      amount: number;
      currency: string;
      date: Date;
      status: 'upcoming';
    }> = [];

    for (const sub of subscriptions) {
      const billingDate = new Date(sub.nextBillingDate);
      let loops = 0;

      while (billingDate < nextMonthStart && loops < 1000) {
        loops++;

        if (billingDate >= monthStart) {
          const key = paidKey(sub.id, billingDate);

          if (!paidPaymentKeys.has(key)) {
            upcomingItems.push({
              id: `${sub.id}-${billingDate.toISOString()}`,
              subscriptionId: sub.id,
              name: sub.name,
              category: sub.category,
              amount: Number(sub.amount),
              currency: sub.currency,
              date: new Date(billingDate),
              status: 'upcoming',
            });
          }
        }

        try {
          this.incrementBillingDate(sub, billingDate);
        } catch {
          break;
        }
      }
    }

    return [...completedItems, ...upcomingItems].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return a.amount - b.amount;
    });
  }

  async getForecast(userId: string, months: number = 12) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId, isActive: true },
    });

    const forecast = [];
    const now = new Date();

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true },
    });
    const userCurrency = user?.currency || 'USD';

    // Create bucket for each upcoming month
    for (let i = 0; i < months; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);

      forecast.push({
        month: monthNames[targetDate.getMonth()],
        year: targetDate.getFullYear(),
        amount: 0,
        currency: userCurrency,
        payments: [] as any[],
      });
    }

    // Go through each subscription and accurately step forward its next billing dates
    // to slot them into the correct forecast bucket.
    for (const sub of subscriptions) {
      const amount = Number(sub.amount);
      const currentBillingDate = new Date(sub.nextBillingDate);

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
          forecast[index].amount += amount;
          forecast[index].payments.push({
            id: sub.id,
            name: sub.name,
            amount: amount,
            currency: sub.currency,
            date: new Date(currentBillingDate),
          });
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
        } else if (
          sub.billingCycle === BillingCycle.custom &&
          sub.intervalDays
        ) {
          currentBillingDate.setDate(
            currentBillingDate.getDate() + sub.intervalDays,
          );
        } else {
          // Fallback to prevent infinite loops if no clear cycle
          break;
        }
      }
    }

    return forecast;
  }
}
