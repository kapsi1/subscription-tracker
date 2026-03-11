import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex color (e.g. #a855f7)' })
  color?: string;
}
