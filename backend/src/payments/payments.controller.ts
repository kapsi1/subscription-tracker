import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsService } from './payments.service';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsAllController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.paymentsService.findAllForUser(req.user.userId);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('subscriptions/:subscriptionId/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Req() req: RequestWithUser, @Param('subscriptionId') subscriptionId: string) {
    return this.paymentsService.findAllForSubscription(req.user.userId, subscriptionId);
  }

  @Post()
  create(
    @Req() req: RequestWithUser,
    @Param('subscriptionId') subscriptionId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(req.user.userId, subscriptionId, dto);
  }

  @Patch(':paymentId')
  update(
    @Req() req: RequestWithUser,
    @Param('paymentId') paymentId: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.paymentsService.updatePayment(req.user.userId, paymentId, dto);
  }

  @Delete(':paymentId')
  remove(@Req() req: RequestWithUser, @Param('paymentId') paymentId: string) {
    return this.paymentsService.removePayment(req.user.userId, paymentId);
  }
}
