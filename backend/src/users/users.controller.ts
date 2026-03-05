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
  Logger,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { WebPushService } from '../notifications/webpush/webpush.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly webPushService: WebPushService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  async getMe(@Req() req: any) {
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
    @Req() req: any,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    return this.usersService.update(req.user.userId, updateSettingsDto);
  }

  @Post('push-subscription')
  async savePushSubscription(
    @Req() req: any,
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
    @Req() req: any,
    @Query('endpoint') endpoint: string,
  ) {
    return this.usersService.deletePushSubscription(req.user.userId, endpoint);
  }

  @Post('test-push')
  async testPush(
    @Req() req: any,
    @Body() body: { delaySeconds?: number },
  ) {
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
        } catch (error: any) {
          this.logger.error(`Test push failed for endpoint ${sub.endpoint}: ${error.message}`);
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
}
