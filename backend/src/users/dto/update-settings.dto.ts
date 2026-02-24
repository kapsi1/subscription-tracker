import { IsBoolean, IsInt, IsNumber, IsOptional, Min, ValidateIf } from 'class-validator';

export class UpdateSettingsDto {
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
}
