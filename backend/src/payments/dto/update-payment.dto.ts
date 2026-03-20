import { IsISO4217CurrencyCode, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdatePaymentDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsString()
  @IsISO4217CurrencyCode()
  currency?: string;

  @IsOptional()
  @IsString()
  paidAt?: string;
}
