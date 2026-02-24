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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { PushSubscriptionDto } from './dto/push-subscription.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: any) {
    const user = await this.usersService.findById(req.user.id);
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
    return this.usersService.update(req.user.id, updateSettingsDto);
  }

  @Post('push-subscription')
  async savePushSubscription(
    @Req() req: any,
    @Body() subDto: PushSubscriptionDto,
  ) {
    return this.usersService.savePushSubscription(
      req.user.id,
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
    return this.usersService.deletePushSubscription(req.user.id, endpoint);
  }
}
