// src/subscriptions/dto/import-subscription.dto.ts
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSubscriptionDto } from './create-subscription.dto';

export class ImportSubscriptionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubscriptionDto)
  subscriptions!: CreateSubscriptionDto[];
}
