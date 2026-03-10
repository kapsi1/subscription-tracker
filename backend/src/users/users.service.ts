import { Injectable, Logger } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import type { WebhookService } from '../notifications/webhook/webhook.service';
import type { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    this.logger.log(`Updating settings for user ${id}: ${Object.keys(data).join(', ')}`);
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    if (data.currency && typeof data.currency === 'string') {
      this.logger.log(`Performing bulk currency update to ${data.currency} for user ${id}`);
      await this.prisma.subscription.updateMany({
        where: { userId: id },
        data: { currency: data.currency },
      });

      await this.prisma.paymentHistory.updateMany({
        where: { subscription: { userId: id } },
        data: { currency: data.currency },
      });
    }

    return user;
  }

  async savePushSubscription(userId: string, endpoint: string, p256dh: string, auth: string) {
    this.logger.log(`Saving push subscription for user ${userId}`);
    return this.prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId, p256dh, auth },
      create: { userId, endpoint, p256dh, auth },
    });
  }

  async deletePushSubscription(userId: string, endpoint: string) {
    this.logger.log(`Deleting push subscription for user ${userId}`);
    return this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  async testWebhook(_userId: string, url: string, secret?: string) {
    return this.webhookService.sendAlert(url, secret, 'Test Subscription', 3, 19.99, 'USD');
  }

  async remove(id: string): Promise<void> {
    this.logger.warn(`Deleting user account: ${id}`);

    await this.prisma.$transaction(async (tx) => {
      // Manual cascade (since schema doesn't have onDelete: Cascade)
      // 1. Delete payment history
      await tx.paymentHistory.deleteMany({
        where: { subscription: { userId: id } },
      });

      // 2. Delete alerts
      await tx.alert.deleteMany({
        where: { subscription: { userId: id } },
      });

      // 3. Delete subscriptions
      await tx.subscription.deleteMany({
        where: { userId: id },
      });

      // 4. Delete push subscriptions
      await tx.pushSubscription.deleteMany({
        where: { userId: id },
      });

      // 5. Finally delete the user
      await tx.user.delete({
        where: { id },
      });
    });

    this.logger.log(`Successfully deleted user account: ${id}`);
  }
}
