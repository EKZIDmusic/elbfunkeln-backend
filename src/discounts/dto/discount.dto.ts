import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsDateString,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DiscountType } from '@prisma/client';

export class CreateDiscountDto {
  @ApiProperty({ example: 'SUMMER2024' })
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z0-9-_]+$/, {
    message: 'Code must contain only uppercase letters, numbers, hyphens and underscores',
  })
  code: string;

  @ApiPropertyOptional({ example: 'Summer Sale 2024' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ example: 10, description: 'Percentage or fixed amount' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value: number;

  @ApiPropertyOptional({ example: 50, description: 'Minimum order amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minOrderAmount?: number;

  @ApiPropertyOptional({ example: 100, description: 'Maximum number of uses' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxUses?: number;

  @ApiProperty({ example: '2024-06-01T00:00:00Z' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ example: '2024-08-31T23:59:59Z' })
  @IsDateString()
  validUntil: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateDiscountDto extends PartialType(CreateDiscountDto) {}

export class ValidateDiscountDto {
  @ApiProperty({ example: 'SUMMER2024' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 100, description: 'Order subtotal' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  orderAmount?: number;
}