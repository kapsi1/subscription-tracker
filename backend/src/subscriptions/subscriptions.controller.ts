import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ImportSubscriptionsDto } from './dto/import-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(@Req() req: RequestWithUser, @Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(req.user.userId, createSubscriptionDto);
  }

  @Get('export')
  export(@Req() req: RequestWithUser) {
    return this.subscriptionsService.export(req.user.userId);
  }

  @Post('import')
  import(@Req() req: RequestWithUser, @Body() importSubscriptionsDto: ImportSubscriptionsDto) {
    return this.subscriptionsService.import(req.user.userId, importSubscriptionsDto);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.subscriptionsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.subscriptionsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(req.user.userId, id, updateSubscriptionDto);
  }

  @Delete(':id')
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.subscriptionsService.remove(req.user.userId, id);
  }
}
