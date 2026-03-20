import { IsISO4217CurrencyCode, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsISO4217CurrencyCode()
  currency!: string;

  @IsString()
  paidAt!: string;
}
