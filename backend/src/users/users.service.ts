import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { DefaultReminderDto, UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  async findByIdWithDefaultReminders(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { defaultReminders: true },
    });
  }

  async updateSettings(id: string, dto: UpdateSettingsDto): Promise<User> {
    const { defaultReminders, ...userFields } = dto;

    const user = await this.update(id, userFields as Prisma.UserUpdateInput);

    if (defaultReminders !== undefined) {
      await this.prisma.$transaction([
        this.prisma.userDefaultReminder.deleteMany({ where: { userId: id } }),
        ...(defaultReminders.length > 0
          ? [
              this.prisma.userDefaultReminder.createMany({
                data: (defaultReminders as DefaultReminderDto[]).map((r) => ({
                  userId: id,
                  type: r.type,
                  value: r.value,
                  unit: r.unit,
                })),
              }),
            ]
          : []),
      ]);
    }

    return user;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async findByVerificationToken(verificationToken: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { verificationToken },
    });
  }

  async findByPasswordResetToken(passwordResetToken: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { passwordResetToken },
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
        where: { userId: id },
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

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('User not found');
    if (!user.passwordHash)
      throw new BadRequestException('Cannot change password for social-only accounts');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Current password is incorrect');

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    this.logger.log(`Password changed for user: ${id}`);
  }

  async changeEmail(id: string, newEmail: string, currentPassword: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('User not found');
    if (!user.passwordHash)
      throw new BadRequestException('Cannot change email for social-only accounts');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Current password is incorrect');

    const existing = await this.prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) throw new ConflictException('Email already in use');

    const updated = await this.prisma.user.update({ where: { id }, data: { email: newEmail } });
    this.logger.log(`Email changed for user: ${id}`);
    return updated;
  }

  async remove(id: string, password?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('User not found');

    // If regular account (has passwordHash), require password verification
    if (user.passwordHash) {
      if (!password) {
        throw new BadRequestException('Password is required to delete your account.');
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw new UnauthorizedException('Incorrect password. Account deletion aborted.');
      }
    }

    this.logger.warn(`Deleting user account: ${id}`);

    await this.prisma.$transaction(async (tx) => {
      // Manual cascade (since schema doesn't have onDelete: Cascade on all relations)
      // 1. Delete payment history
      await tx.paymentHistory.deleteMany({
        where: { userId: id },
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
