import * as crypto from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BillingCycle, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

import type { CreateSubscriptionDto } from './dto/create-subscription.dto';
import type { ImportSubscriptionsDto } from './dto/import-subscription.dto';
import type { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { calculateNextBillingDate } from './utils/billing-date.util';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateSubscriptionDto) {
    if (
      createDto.billingCycle === BillingCycle.custom &&
      !createDto.intervalDays &&
      (!createDto.billingDays || createDto.billingDays.length === 0)
    ) {
      throw new BadRequestException(
        'intervalDays or billingDays is required for custom billing cycle',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const nextBillingDate = createDto.nextBillingDate
      ? new Date(createDto.nextBillingDate)
      : calculateNextBillingDate(
          createDto.billingCycle,
          new Date(),
          createDto.intervalDays,
          createDto.billingDays,
          createDto.billingMonthShortageOffset,
          createDto.billingMonthShortageDirection as 'before' | 'after' | 'skip',
        );

    // Determine reminders: use provided list, or fall back to user defaults
    const reminders =
      createDto.reminders ??
      (await this.prisma.userDefaultReminder.findMany({ where: { userId } })).map((r) => ({
        type: r.type,
        value: r.value,
        unit: r.unit,
      }));

    const reminderEnabled =
      createDto.reminderEnabled !== undefined ? createDto.reminderEnabled : reminders.length > 0;

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        name: createDto.name,
        amount: createDto.amount,
        currency: user.currency,
        billingCycle: createDto.billingCycle,
        intervalDays: createDto.intervalDays || null,
        billingDays: createDto.billingDays || [],
        billingMonthShortageOffset: createDto.billingMonthShortageOffset || 1,
        billingMonthShortageDirection: createDto.billingMonthShortageDirection || 'before',
        category: createDto.category,
        nextBillingDate,
        reminderEnabled,
        alerts: reminderEnabled
          ? { create: reminders.map((r) => ({ type: r.type, daysBefore: r.value, unit: r.unit })) }
          : undefined,
      },
      include: { alerts: true },
    });

    return this.mapSubscription(subscription);
  }

  async findAll(userId: string) {
    const subs = await this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { nextBillingDate: 'asc' },
      include: { alerts: true },
    });
    return subs.map((s) => this.mapSubscription(s));
  }

  private mapSubscription(sub: Prisma.SubscriptionGetPayload<{ include: { alerts: true } }>) {
    const { alerts, ...rest } = sub;
    return {
      ...rest,
      reminders: alerts.map((a) => ({ id: a.id, type: a.type, value: a.daysBefore, unit: a.unit })),
    };
  }

  async export(userId: string) {
    const [subscriptions, categories, standalonePayments] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { userId },
        include: {
          payments: {
            select: {
              amount: true,
              currency: true,
              paidAt: true,
            },
          },
        },
      }),
      this.prisma.category.findMany({
        where: { userId },
        select: {
          name: true,
          color: true,
          icon: true,
        },
      }),
      this.prisma.paymentHistory.findMany({
        where: { userId, subscriptionId: null },
        select: {
          subscriptionName: true,
          amount: true,
          currency: true,
          paidAt: true,
        },
      }),
    ]);

    return {
      subscriptions: subscriptions.map((sub) => ({
        name: sub.name,
        amount: Number(sub.amount),
        currency: sub.currency,
        billingCycle: sub.billingCycle,
        intervalDays: sub.intervalDays,
        billingDays: sub.billingDays,
        billingMonthShortageOffset: sub.billingMonthShortageOffset,
        billingMonthShortageDirection: sub.billingMonthShortageDirection,
        category: sub.category,
        nextBillingDate: sub.nextBillingDate,
        reminderEnabled: sub.reminderEnabled,
        reminderDays: sub.reminderDays,
        isActive: sub.isActive,
        payments: sub.payments.map((p) => ({
          amount: Number(p.amount),
          currency: p.currency,
          paidAt: p.paidAt,
        })),
      })),
      categories,
      payments: standalonePayments.map((p) => ({
        subscriptionName: p.subscriptionName,
        amount: Number(p.amount),
        currency: p.currency,
        paidAt: p.paidAt,
      })),
    };
  }

  async import(userId: string, importDto: ImportSubscriptionsDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const result = {
      subscriptionsCount: 0,
      categoriesCount: 0,
      paymentsCount: 0,
    };

    await this.prisma.$transaction(async (tx) => {
      if (importDto.replace) {
        await Promise.all([
          tx.subscription.deleteMany({ where: { userId } }),
          tx.category.deleteMany({ where: { userId } }),
          tx.paymentHistory.deleteMany({ where: { userId } }),
        ]);
      }

      // 1. Import Categories
      if (importDto.categories?.length) {
        for (const cat of importDto.categories) {
          await tx.category.upsert({
            where: {
              userId_name: {
                userId,
                name: cat.name,
              },
            },
            create: {
              userId,
              name: cat.name,
              color: cat.color,
              icon: cat.icon,
            },
            update: {
              color: cat.color,
              icon: cat.icon,
            },
          });
        }
        result.categoriesCount = importDto.categories.length;
      }

      // 2. Import Subscriptions
      if (importDto.subscriptions?.length) {
        for (const sub of importDto.subscriptions) {
          if (
            sub.billingCycle === BillingCycle.custom &&
            !sub.intervalDays &&
            (!sub.billingDays || sub.billingDays.length === 0)
          ) {
            throw new BadRequestException(
              `intervalDays or billingDays is required for custom billing cycle on subscription: ${sub.name}`,
            );
          }

          const subId = crypto.randomUUID();
          const nextBillingDate = sub.nextBillingDate
            ? new Date(sub.nextBillingDate)
            : calculateNextBillingDate(
                sub.billingCycle,
                new Date(),
                sub.intervalDays,
                sub.billingDays,
                sub.billingMonthShortageOffset,
                sub.billingMonthShortageDirection as 'before' | 'after' | 'skip',
              );

          const importReminders = sub.reminders ?? [];
          const importReminderEnabled =
            sub.reminderEnabled !== undefined ? sub.reminderEnabled : importReminders.length > 0;

          await tx.subscription.create({
            data: {
              id: subId,
              userId,
              name: sub.name,
              amount: sub.amount,
              currency: sub.currency || user.currency,
              billingCycle: sub.billingCycle,
              intervalDays: sub.intervalDays || null,
              billingDays: sub.billingDays || [],
              billingMonthShortageOffset: sub.billingMonthShortageOffset || 1,
              billingMonthShortageDirection: sub.billingMonthShortageDirection || 'before',
              category: sub.category,
              nextBillingDate,
              reminderEnabled: importReminderEnabled,
              alerts: importReminderEnabled && importReminders.length > 0
                ? { create: importReminders.map((r) => ({ type: r.type, daysBefore: r.value, unit: r.unit })) }
                : undefined,
              isActive: sub.isActive ?? true,
            },
          });

          if (sub.payments?.length) {
            await tx.paymentHistory.createMany({
              data: sub.payments.map((p) => ({
                userId,
                subscriptionId: subId,
                subscriptionName: sub.name,
                amount: p.amount,
                currency: p.currency,
                paidAt: new Date(p.paidAt),
              })),
            });
            result.paymentsCount += sub.payments.length;
          }
        }
        result.subscriptionsCount = importDto.subscriptions.length;
      }

      // 3. Import Standalone Payments
      if (importDto.payments?.length) {
        await tx.paymentHistory.createMany({
          data: importDto.payments.map((p) => ({
            userId,
            subscriptionName: p.subscriptionName,
            amount: p.amount,
            currency: p.currency,
            paidAt: new Date(p.paidAt),
          })),
        });
        result.paymentsCount += importDto.payments.length;
      }
    });

    return {
      message: `Successfully imported ${result.subscriptionsCount} subscriptions, ${result.categoriesCount} categories, and ${result.paymentsCount} payments`,
      ...result,
    };
  }

  async findOne(userId: string, id: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, userId },
      include: { alerts: true },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return this.mapSubscription(subscription);
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
    const billingDays =
      updateDto.billingDays !== undefined ? updateDto.billingDays : existing.billingDays;
    const shortageOffset =
      updateDto.billingMonthShortageOffset !== undefined
        ? updateDto.billingMonthShortageOffset
        : existing.billingMonthShortageOffset;
    const shortageDirection =
      (updateDto.billingMonthShortageDirection as 'before' | 'after' | 'skip') ||
      existing.billingMonthShortageDirection;

    if (
      billingCycle === BillingCycle.custom &&
      !intervalDays &&
      (!billingDays || billingDays.length === 0)
    ) {
      throw new BadRequestException(
        'intervalDays or billingDays is required for custom billing cycle',
      );
    }

    // If nextBillingDate is provided in DTO, use it.
    // Otherwise, if billing cycle or interval changes, recalculate next billing date
    let nextBillingDate = existing.nextBillingDate;
    if (updateDto.nextBillingDate) {
      nextBillingDate = new Date(updateDto.nextBillingDate);
    } else if (updateDto.billingCycle || updateDto.intervalDays || updateDto.billingDays) {
      nextBillingDate = calculateNextBillingDate(
        billingCycle,
        new Date(),
        intervalDays,
        billingDays,
        shortageOffset,
        shortageDirection as 'before' | 'after' | 'skip',
      );
    }

    // Determine reminderEnabled: explicit value, or derive from reminders list
    const reminderEnabled =
      updateDto.reminderEnabled !== undefined
        ? updateDto.reminderEnabled
        : updateDto.reminders !== undefined
          ? updateDto.reminders.length > 0
          : undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Replace alert records if reminders provided
      if (updateDto.reminders !== undefined) {
        await tx.alert.deleteMany({ where: { subscriptionId: id } });
        if (updateDto.reminders.length > 0) {
          await tx.alert.createMany({
            data: updateDto.reminders.map((r) => ({
              subscriptionId: id,
              type: r.type,
              daysBefore: r.value,
              unit: r.unit,
            })),
          });
        }
      }

      return tx.subscription.update({
        where: { id },
        data: {
          ...(updateDto.name && { name: updateDto.name }),
          ...(updateDto.amount !== undefined && { amount: updateDto.amount }),
          currency: user.currency,
          ...(updateDto.category && { category: updateDto.category }),
          ...(updateDto.isActive !== undefined && { isActive: updateDto.isActive }),
          ...(reminderEnabled !== undefined && { reminderEnabled }),
          billingCycle,
          intervalDays: intervalDays ?? null,
          billingDays: billingDays ?? [],
          billingMonthShortageOffset: shortageOffset,
          billingMonthShortageDirection: shortageDirection,
          nextBillingDate,
        },
        include: { alerts: true },
      });
    });

    return this.mapSubscription(updated);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.subscription.delete({
      where: { id },
    });
  }
}
