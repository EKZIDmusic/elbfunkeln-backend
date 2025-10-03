import { IsString, IsOptional, IsEmail, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Max' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Mustermann' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'max@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+49 123 456789' })
  @IsOptional()
  @IsString()
  @Matches(/^(\+49|0)[1-9]\d{1,14}$/, {
    message: 'Invalid German phone number',
  })
  phone?: string;
}