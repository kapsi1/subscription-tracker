import {
  IsString,
  IsNumber,
  IsPositive,
  IsISO4217CurrencyCode,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
  ValidateIf,
  IsBoolean,
} from 'class-validator';
import { BillingCycle } from '@prisma/client';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsISO4217CurrencyCode()
  currency?: string;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ValidateIf((o) => o.billingCycle === BillingCycle.custom)
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalDays?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
}
