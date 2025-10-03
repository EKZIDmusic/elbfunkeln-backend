import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @ApiPropertyOptional({ example: 'Tolles Produkt!' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ example: 'Sehr schöner Drahtring, gute Qualität!' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @ApiPropertyOptional({ example: 'Aktualisierter Titel' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ example: 'Aktualisierter Kommentar' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}