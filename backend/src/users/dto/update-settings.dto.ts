import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

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
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  webhookEnabled?: boolean;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  @IsBoolean()
  dailyDigest?: boolean;

  @IsOptional()
  @IsBoolean()
  weeklyReport?: boolean;
}
