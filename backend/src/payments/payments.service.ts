import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DashboardService } from '../dashboard/dashboard.service';

import { EmailService } from '../notifications/email/email.service';

import { PrismaService } from '../prisma/prisma.service';

import { calculateNextBillingDate } from '../subscriptions/utils/billing-date.util';
import type { CreatePaymentDto } from './dto/create-payment.dto';
import type { CreateStandalonePaymentDto } from './dto/create-standalone-payment.dto';
import type { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly dashboardService: DashboardService,
  ) {}

  /**
   * Processes all overdue payments (nextBillingDate < today midnight)
   * and sends daily digests to users who have it enabled.
   */
  async processPaymentsAndSendDigests() {
    const now = new Date();
    // Start of "today" (midnight)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Start of "yesterday" (midnight)
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    this.logger.log({
      msg: 'Processing payments',
      today: todayStart.toISOString(),
      yesterday: yesterdayStart.toISOString(),
    });

    // 1. Find all active subscriptions that are due (nextBillingDate < todayStart)
    const dueSubscriptions = await this.prisma.subscription.findMany({
      where: {
        isActive: true,
        nextBillingDate: {
          lt: todayStart,
        },
      },
    });

    if (dueSubscriptions.length === 0) {
      this.logger.log('No due subscriptions to process.');
      // Even if no payments were made, we might still want to send digests?
      // The requirement says: "when a subscription was paid a previous day"
      // This implies we ONLY send it if there were payments.
    } else {
      const paymentsByUser: Record<string, { name: string; amount: number; currency: string }[]> =
        {};

      for (const sub of dueSubscriptions) {
        // Create payment history record
        await this.prisma.paymentHistory.create({
          data: {
            userId: sub.userId,
            subscriptionId: sub.id,
            subscriptionName: sub.name,
            amount: sub.amount,
            currency: sub.currency,
            paidAt: sub.nextBillingDate, // Use the date it was actually due
          },
        });

        // Calculate next billing date
        const nextDate = calculateNextBillingDate(
          sub.billingCycle,
          sub.nextBillingDate,
          sub.intervalDays,
          sub.billingDays,
        );

        // Update subscription
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            nextBillingDate: nextDate,
          },
        });

        // If it was due EXACTLY yesterday, add to digest list for the email
        if (sub.nextBillingDate >= yesterdayStart && sub.nextBillingDate < todayStart) {
          if (!paymentsByUser[sub.userId]) {
            paymentsByUser[sub.userId] = [];
          }
          paymentsByUser[sub.userId].push({
            name: sub.name,
            amount: Number(sub.amount),
            currency: sub.currency,
          });
        }

        this.logger.log({
          msg: 'Processed payment',
          subscriptionId: sub.id,
          name: sub.name,
          newNextBillingDate: nextDate.toISOString(),
        });
      }

      // 2. Identify users who need a digest (those who have payments yesterday AND dailyDigest enabled)
      const userIdsWithPayments = Object.keys(paymentsByUser);
      if (userIdsWithPayments.length > 0) {
        const usersToNotify = await this.prisma.user.findMany({
          where: {
            id: { in: userIdsWithPayments },
            dailyDigest: true,
            emailNotifications: true,
          },
          include: {
            subscriptions: {
              where: { isActive: true },
            },
          },
        });

        const oneWeekFromNow = new Date(todayStart);
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

        for (const user of usersToNotify) {
          const paidYesterday = paymentsByUser[user.id] || [];

          // Calculate summary stats using DashboardService
          const costSummary = this.dashboardService.calculateCosts(user.subscriptions);

          // Count upcoming payments in the next 7 days
          const upcomingCount = user.subscriptions.filter(
            (s) => s.nextBillingDate >= todayStart && s.nextBillingDate < oneWeekFromNow,
          ).length;

          const stats = {
            totalActive: costSummary.activeSubscriptions,
            totalMonthly: costSummary.totalMonthlyCost,
            upcomingThisWeek: upcomingCount,
          };

          try {
            await this.emailService.sendDailyDigest(
              user.email,
              stats,
              paidYesterday,
              'USD',
              (user.language as 'en' | 'pl') || 'en',
              user.accentColor,
              user.theme,
              user.name ?? undefined,
            );
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to send daily digest to ${user.email}: ${message}`);
          }
        }
      } else {
        this.logger.log('No payments were due yesterday; skipping daily digests.');
      }
    }
  }

  async createStandalonePayment(userId: string, dto: CreateStandalonePaymentDto) {
    return this.prisma.paymentHistory.create({
      data: {
        userId,
        subscriptionId: null,
        subscriptionName: dto.subscriptionName,
        amount: dto.amount,
        currency: dto.currency,
        paidAt: new Date(dto.paidAt),
      },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.paymentHistory.findMany({
      where: { userId },
      orderBy: { paidAt: 'desc' },
    });
  }

  async findAllForSubscription(userId: string, subscriptionId: string) {
    // Verify subscription belongs to user
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.paymentHistory.findMany({
      where: { subscriptionId },
      orderBy: { paidAt: 'desc' },
    });
  }

  async createPayment(userId: string, subscriptionId: string, dto: CreatePaymentDto) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.paymentHistory.create({
      data: {
        userId,
        subscriptionId,
        subscriptionName: subscription.name,
        amount: dto.amount,
        currency: dto.currency,
        paidAt: new Date(dto.paidAt),
      },
    });
  }

  async updatePayment(userId: string, paymentId: string, dto: UpdatePaymentDto) {
    const payment = await this.prisma.paymentHistory.findFirst({
      where: { id: paymentId, userId },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.prisma.paymentHistory.update({
      where: { id: paymentId },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.paidAt && { paidAt: new Date(dto.paidAt) }),
        ...(dto.subscriptionName && { subscriptionName: dto.subscriptionName }),
      },
    });
  }

  async removePayment(userId: string, paymentId: string) {
    const payment = await this.prisma.paymentHistory.findFirst({
      where: { id: paymentId, userId },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.prisma.paymentHistory.delete({
      where: { id: paymentId },
    });
  }
}
