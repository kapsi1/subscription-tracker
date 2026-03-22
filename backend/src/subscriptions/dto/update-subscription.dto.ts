import { BillingCycle } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ValidateIf((o) => o.billingCycle === BillingCycle.custom)
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalDays?: number;

  @ValidateIf((o) => o.billingCycle === BillingCycle.custom)
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  billingDays?: number[];

  @IsOptional()
  @IsInt()
  billingMonthShortageOffset?: number;

  @IsOptional()
  @IsString()
  billingMonthShortageDirection?: string;

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
