// src/subscriptions/dto/standalone-payment.dto.ts

import { IsISO4217CurrencyCode, IsNumber, IsPositive, IsString } from 'class-validator';

export class StandalonePaymentDto {
  @IsString()
  subscriptionName!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsISO4217CurrencyCode()
  currency!: string;

  @IsString()
  paidAt!: string;
}
