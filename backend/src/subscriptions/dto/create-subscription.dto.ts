import { BillingCycle } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO4217CurrencyCode,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  name!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsEnum(BillingCycle)
  billingCycle!: BillingCycle;

  @ValidateIf((o) => o.billingCycle === BillingCycle.custom)
  @IsInt()
  @Min(1)
  intervalDays?: number;

  @IsString()
  category!: string;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  reminderDays?: number;

  @IsOptional()
  @IsString()
  nextBillingDate?: string;

  @IsOptional()
  @IsString()
  @IsISO4217CurrencyCode()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentHistoryDto)
  payments?: PaymentHistoryDto[];
}

export class PaymentHistoryDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsISO4217CurrencyCode()
  currency!: string;

  @IsString()
  paidAt!: string;
}
