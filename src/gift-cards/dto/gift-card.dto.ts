import {
  IsString,
  IsNumber,
  IsOptional,
  IsEmail,
  Min,
  Max,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PurchaseGiftCardDto {
  @ApiProperty({ example: 50, minimum: 10, maximum: 500 })
  @IsNumber()
  @Min(10)
  @Max(500)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ example: 'max@example.com' })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiPropertyOptional({ example: 'Max Mustermann' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientName?: string;

  @ApiPropertyOptional({ example: 'Alles Gute zum Geburtstag!' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class CreateGiftCardDto {
  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  initialValue: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchasedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateGiftCardDto extends PartialType(CreateGiftCardDto) {}

export class ValidateGiftCardDto {
  @ApiProperty({ example: 'GIFT-XXXXXXXX' })
  @IsString()
  code: string;
}