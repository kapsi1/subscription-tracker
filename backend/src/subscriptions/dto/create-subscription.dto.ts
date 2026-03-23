import { AlertType, BillingCycle, ReminderUnit } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
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

export class ReminderDto {
  @IsEnum(AlertType)
  type!: AlertType;

  @IsInt()
  @Min(1)
  value!: number;

  @IsEnum(ReminderUnit)
  unit!: ReminderUnit;
}

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

  @ValidateIf((o) => o.billingCycle === BillingCycle.custom)
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

  @IsString()
  category!: string;

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
