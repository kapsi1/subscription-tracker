import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateCategoryDto } from '../../categories/dto/create-category.dto';
import { CreateSubscriptionDto } from './create-subscription.dto';
import { StandalonePaymentDto } from './standalone-payment.dto';

export class ImportSubscriptionsDto {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSubscriptionDto)
  subscriptions?: CreateSubscriptionDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateCategoryDto)
  categories?: CreateCategoryDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => StandalonePaymentDto)
  payments?: StandalonePaymentDto[];

  @IsOptional()
  @IsBoolean()
  replace?: boolean;
}
