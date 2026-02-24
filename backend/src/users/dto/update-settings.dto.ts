import { IsBoolean, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  defaultReminderEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  defaultReminderDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyBudget?: number;
}
