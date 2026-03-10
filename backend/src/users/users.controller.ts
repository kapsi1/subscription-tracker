import {
  Controller,
  Get,
  Body,
  Patch,
  Post,
  Delete,
  Query,
  Req,
  UseGuards,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { UpdateSettingsDto } from './dto/update-settings.dto';
import type { PushSubscriptionDto } from './dto/push-subscription.dto';
import type { WebPushService } from '../notifications/webpush/webpush.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { EmailService } from '../notifications/email/email.service';
import type { RequestWithUser } from '../common/interfaces/request.interface';


@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly webPushService: WebPushService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private assertTestEndpointsEnabled() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Test endpoints are disabled in production.');
    }
  }

  @Get('me')
  async getMe(@Req() req: RequestWithUser) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Don't return password hash
    const { passwordHash, ...result } = user;
    return result;
  }

  @Patch('settings')
  async updateSettings(
    @Req() req: RequestWithUser,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    return this.usersService.update(req.user.userId, updateSettingsDto);
  }

  @Post('push-subscription')
  async savePushSubscription(
    @Req() req: RequestWithUser,
    @Body() subDto: PushSubscriptionDto,
  ) {
    return this.usersService.savePushSubscription(
      req.user.userId,
      subDto.endpoint,
      subDto.keys.p256dh,
      subDto.keys.auth,
    );
  }

  @Delete('push-subscription')
  async deletePushSubscription(
    @Req() req: RequestWithUser,
    @Query('endpoint') endpoint: string,
  ) {
    return this.usersService.deletePushSubscription(req.user.userId, endpoint);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('test-push')
  async testPush(
    @Req() req: RequestWithUser,
    @Body() body: { delaySeconds?: number },
  ) {
    this.assertTestEndpointsEnabled();

    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId: req.user.userId },
    });

    if (subs.length === 0) {
      throw new BadRequestException('No push subscriptions found. Enable push notifications first.');
    }

    const delay = Math.max(0, Math.min(body.delaySeconds ?? 0, 300));
    const payload = {
      title: 'Test Notification',
      body: `This is a test push notification${delay > 0 ? ` (delayed ${delay}s)` : ''}.`,
    };

    const sendAll = async () => {
      for (const sub of subs) {
        try {
          await this.webPushService.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error(`Test push failed for endpoint ${sub.endpoint}: ${message}`);
        }
      }
    };

    if (delay > 0) {
      setTimeout(() => void sendAll(), delay * 1000);
      return { message: `Test notification scheduled in ${delay} seconds.` };
    }

    await sendAll();
    return { message: 'Test notification sent.' };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('test-email')
  async testEmail(@Req() req: RequestWithUser, @Body() body: { lang?: string }) {
    this.assertTestEndpointsEnabled();

    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.emailNotifications) {
      throw new BadRequestException(
        'Email notifications are disabled. Enable them in settings first.',
      );
    }

    const language = body?.lang === 'pl' ? 'pl' : 'en';

    await this.emailService.sendAlert(
      user.email,
      'Test Subscription',
      user.defaultReminderDays,
      9.99,
      'USD',
      language,
      user.accentColor,
      user.theme,
    );

    return {
      message:
        language === 'pl'
          ? `Wyslano testowy e-mail przypomnienia na adres ${user.email}.`
          : `Test reminder email sent to ${user.email}.`,
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('test-budget-email')
  async testBudgetEmail(@Req() req: RequestWithUser, @Body() body: { lang?: string }) {
    this.assertTestEndpointsEnabled();

    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.emailNotifications) {
      throw new BadRequestException(
        'Email notifications are disabled. Enable them in settings first.',
      );
    }

    const language = body?.lang === 'pl' ? 'pl' : 'en';
    const budget = user.monthlyBudget ? Number(user.monthlyBudget) : 50;
    const amount = budget + 12.34;

    await this.emailService.sendBudgetAlert(
      user.email,
      amount,
      budget,
      'USD',
      user.accentColor,
      user.theme,
      language,
    );

    return {
      message:
        language === 'pl'
          ? `Wysłano testowy e-mail alertu budżetowego na adres ${user.email}.`
          : `Test budget alert email sent to ${user.email}.`,
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('test-daily-digest')
  async testDailyDigest(@Req() req: RequestWithUser, @Body() body: { lang?: string }) {
    this.assertTestEndpointsEnabled();

    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.emailNotifications) throw new BadRequestException('Email notifications are disabled.');

    const language = body?.lang === 'pl' ? 'pl' : 'en';

    await this.emailService.sendDailyDigest(
      user.email,
      { totalActive: 5, totalMonthly: 125.50, upcomingThisWeek: 2 },
      [
        { name: 'Netflix', amount: 15.99, currency: 'USD' },
        { name: 'Spotify', amount: 9.99, currency: 'USD' },
      ],
      'USD',
      language,
      user.accentColor,
      user.theme,
    );

    return { message: language === 'pl' ? `Wysłano testowy dzienny przegląd.` : `Test daily digest sent.` };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('test-weekly-report')
  async testWeeklyReport(@Req() req: RequestWithUser, @Body() body: { lang?: string }) {
    this.assertTestEndpointsEnabled();

    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.emailNotifications) throw new BadRequestException('Email notifications are disabled.');

    const language = body?.lang === 'pl' ? 'pl' : 'en';

    await this.emailService.sendWeeklyReport(
      user.email,
      { totalActive: 5, totalMonthly: 125.50, upcomingThisWeek: 2 },
      'USD',
      language,
      user.accentColor,
      user.theme,
    );

    return { message: language === 'pl' ? `Wysłano testowy raport tygodniowy.` : `Test weekly report sent.` };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('test-webhook')
  async testWebhook(
    @Req() req: RequestWithUser,
    @Body() body: { url: string; secret?: string },
  ) {
    this.assertTestEndpointsEnabled();

    if (!body.url) {
      throw new BadRequestException('Webhook URL is required');
    }

    try {
      await this.usersService.testWebhook(req.user.userId, body.url, body.secret);
      return { message: 'Test webhook sent successfully.' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Test webhook failed: ${message}`);
      throw new BadRequestException(`Test webhook failed: ${message}`);
    }
  }

  @Delete('me')
  async deleteMe(@Req() req: RequestWithUser) {
    await this.usersService.remove(req.user.userId);
    return { message: 'Account deleted successfully' };
  }
}
