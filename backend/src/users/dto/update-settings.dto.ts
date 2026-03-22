import {
  IsBoolean,
  IsInt,
  IsISO4217CurrencyCode,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  defaultReminderEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  defaultReminderDays?: number;

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
  weeklyReport?: boolean;
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
