import * as crypto from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BillingCycle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

import type { CreateSubscriptionDto } from './dto/create-subscription.dto';
import type { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { calculateNextBillingDate } from './utils/billing-date.util';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateSubscriptionDto) {
    if (createDto.billingCycle === BillingCycle.custom && !createDto.intervalDays) {
      throw new BadRequestException('intervalDays is required for custom billing cycle');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const nextBillingDate = createDto.nextBillingDate
      ? new Date(createDto.nextBillingDate)
      : calculateNextBillingDate(createDto.billingCycle, new Date(), createDto.intervalDays);

    return this.prisma.subscription.create({
      data: {
        userId,
        name: createDto.name,
        amount: createDto.amount,
        currency: user.currency,
        billingCycle: createDto.billingCycle,
        intervalDays: createDto.intervalDays || null,
        category: createDto.category,
        nextBillingDate,
        reminderEnabled: createDto.reminderEnabled ?? user.defaultReminderEnabled,
        reminderDays: createDto.reminderDays ?? user.defaultReminderDays,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { nextBillingDate: 'asc' },
    });
  }

  async export(userId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId },
      select: {
        name: true,
        amount: true,
        currency: true,
        billingCycle: true,
        intervalDays: true,
        category: true,
        nextBillingDate: true,
        reminderEnabled: true,
        reminderDays: true,
        isActive: true,
      },
    });
    return { subscriptions };
  }

  async import(userId: string, importDto: { subscriptions: CreateSubscriptionDto[] }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const subscriptionsToCreate = importDto.subscriptions.map((sub) => {
      if (sub.billingCycle === BillingCycle.custom && !sub.intervalDays) {
        throw new BadRequestException(
          `intervalDays is required for custom billing cycle on subscription: ${sub.name}`,
        );
      }

      const id = crypto.randomUUID();
      const nextBillingDate = sub.nextBillingDate
        ? new Date(sub.nextBillingDate)
        : calculateNextBillingDate(sub.billingCycle, new Date(), sub.intervalDays);

      return {
        id,
        userId,
        name: sub.name,
        amount: sub.amount,
        currency: sub.currency || user.currency,
        billingCycle: sub.billingCycle,
        intervalDays: sub.intervalDays || null,
        category: sub.category,
        nextBillingDate,
        reminderEnabled: sub.reminderEnabled ?? user.defaultReminderEnabled,
        reminderDays: sub.reminderDays ?? user.defaultReminderDays,
        isActive: sub.isActive ?? true,
        payments: sub.payments || [],
      };
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.createMany({
        data: subscriptionsToCreate.map(({ payments, ...sub }) => sub),
      });

      const allPayments = subscriptionsToCreate.flatMap((sub) =>
        sub.payments.map((p) => ({
          subscriptionId: sub.id,
          amount: p.amount,
          currency: p.currency,
          paidAt: new Date(p.paidAt),
        })),
      );

      if (allPayments.length > 0) {
        await tx.paymentHistory.createMany({
          data: allPayments,
        });
      }
    });

    return {
      message: `Successfully imported ${subscriptionsToCreate.length} subscriptions`,
      count: subscriptionsToCreate.length,
    };
  }

  async findOne(userId: string, id: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, userId },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }

  async update(userId: string, id: string, updateDto: UpdateSubscriptionDto) {
    // Verify subscription exists AND belongs to user; also fetch user in parallel
    const [existing, user] = await Promise.all([
      this.findOne(userId, id),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');

    const billingCycle = updateDto.billingCycle || existing.billingCycle;
    const intervalDays =
      updateDto.intervalDays !== undefined ? updateDto.intervalDays : existing.intervalDays;

    if (billingCycle === BillingCycle.custom && !intervalDays) {
      throw new BadRequestException('intervalDays is required for custom billing cycle');
    }

    // If nextBillingDate is provided in DTO, use it.
    // Otherwise, if billing cycle or interval changes, recalculate next billing date
    let nextBillingDate = existing.nextBillingDate;
    if (updateDto.nextBillingDate) {
      nextBillingDate = new Date(updateDto.nextBillingDate);
    } else if (updateDto.billingCycle || updateDto.intervalDays) {
      nextBillingDate = calculateNextBillingDate(billingCycle, new Date(), intervalDays);
    }

    return this.prisma.subscription.update({
      where: { id },
      data: {
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.amount !== undefined && { amount: updateDto.amount }),
        currency: user.currency,
        ...(updateDto.category && { category: updateDto.category }),
        ...(updateDto.isActive !== undefined && {
          isActive: updateDto.isActive,
        }),
        ...(updateDto.reminderEnabled !== undefined && {
          reminderEnabled: updateDto.reminderEnabled,
        }),
        ...(updateDto.reminderDays !== undefined && {
          reminderDays: updateDto.reminderDays,
        }),
        billingCycle,
        intervalDays,
        nextBillingDate,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.subscription.delete({
      where: { id },
    });
  }
}
