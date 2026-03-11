import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

class CategoryOrderItem {
  @IsString()
  id!: string;

  @IsInt()
  @Min(0)
  order!: number;
}

export class ReorderCategoriesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CategoryOrderItem)
  items!: CategoryOrderItem[];
}
