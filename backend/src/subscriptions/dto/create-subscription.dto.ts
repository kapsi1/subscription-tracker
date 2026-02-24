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

export class CreateSubscriptionDto {
  @IsString()
  name!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsISO4217CurrencyCode()
  currency!: string;

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
}
