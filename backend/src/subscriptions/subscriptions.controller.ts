import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { ImportSubscriptionsDto } from './dto/import-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(
    @Req() req: any,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(
      req.user.userId,
      createSubscriptionDto,
    );
  }

  @Get('export')
  export(@Req() req: any) {
    return this.subscriptionsService.export(req.user.userId);
  }

  @Post('import')
  import(
    @Req() req: any,
    @Body() importSubscriptionsDto: ImportSubscriptionsDto,
  ) {
    return this.subscriptionsService.import(
      req.user.userId,
      importSubscriptionsDto,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.subscriptionsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.subscriptionsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(
      req.user.userId,
      id,
      updateSubscriptionDto,
    );
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.subscriptionsService.remove(req.user.userId, id);
  }
}
