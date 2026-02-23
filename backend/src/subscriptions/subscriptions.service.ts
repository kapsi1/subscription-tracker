import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { calculateNextBillingDate } from './utils/billing-date.util';
import { Prisma, BillingCycle } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateSubscriptionDto) {
    if (createDto.billingCycle === BillingCycle.custom && !createDto.intervalDays) {
      throw new BadRequestException('intervalDays is required for custom billing cycle');
    }

    const nextBillingDate = createDto.nextBillingDate 
      ? new Date(createDto.nextBillingDate)
      : calculateNextBillingDate(
          createDto.billingCycle, 
          new Date(), 
          createDto.intervalDays
        );

    return this.prisma.subscription.create({
      data: {
        userId,
        name: createDto.name,
        amount: createDto.amount,
        currency: createDto.currency,
        billingCycle: createDto.billingCycle,
        intervalDays: createDto.intervalDays || null,
        category: createDto.category,
        nextBillingDate,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { nextBillingDate: 'asc' },
    });
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
    // Verify it exists AND belongs to user
    const existing = await this.findOne(userId, id);

    const billingCycle = updateDto.billingCycle || existing.billingCycle;
    const intervalDays = updateDto.intervalDays !== undefined ? updateDto.intervalDays : existing.intervalDays;

    if (billingCycle === BillingCycle.custom && !intervalDays) {
      throw new BadRequestException('intervalDays is required for custom billing cycle');
    }

    // If nextBillingDate is provided in DTO, use it.
    // Otherwise, if billing cycle or interval changes, recalculate next billing date
    let nextBillingDate = existing.nextBillingDate;
    if (updateDto.nextBillingDate) {
      nextBillingDate = new Date(updateDto.nextBillingDate);
    } else if (updateDto.billingCycle || updateDto.intervalDays) {
      nextBillingDate = calculateNextBillingDate(
        billingCycle,
        new Date(), 
        intervalDays
      );
    }

    return this.prisma.subscription.update({
      where: { id },
      data: {
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.amount !== undefined && { amount: updateDto.amount }),
        ...(updateDto.currency && { currency: updateDto.currency }),
        ...(updateDto.category && { category: updateDto.category }),
        ...(updateDto.isActive !== undefined && { isActive: updateDto.isActive }),
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
