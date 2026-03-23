import { BillingCycle } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
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
  ValidateNested,
} from 'class-validator';
import { ReminderDto } from './create-subscription.dto';

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
  @Min(1)
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReminderDto)
  @ArrayMaxSize(5)
  reminders?: ReminderDto[];

  @IsOptional()
  @IsString()
  nextBillingDate?: string;
}
