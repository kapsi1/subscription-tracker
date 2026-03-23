import { AlertType, ReminderUnit } from '@prisma/client';
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
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class DefaultReminderDto {
  @IsEnum(AlertType)
  type!: AlertType;

  @IsInt()
  @Min(1)
  value!: number;

  @IsEnum(ReminderUnit)
  unit!: ReminderUnit;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  defaultReminderEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DefaultReminderDto)
  @ArrayMaxSize(5)
  defaultReminders?: DefaultReminderDto[];

  @ValidateIf((_o, value) => value !== null)
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyBudget?: number | null;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsString({ each: true })
  recentAccentColors?: string[];

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  dailyDigest?: boolean;

  @IsOptional()
  @IsBoolean()
  previousWeekReport?: boolean;

  @IsOptional()
  @IsBoolean()
  nextWeekReport?: boolean;

  @IsOptional()
  @IsString()
  dashboardSortBy?: string;

  @IsOptional()
  @IsString()
  dashboardSortOrder?: string;

  @IsOptional()
  @IsBoolean()
  showPaidPayments?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSeenManageHint?: boolean;

  @IsOptional()
  @IsString()
  @IsISO4217CurrencyCode()
  currency?: string;
}
