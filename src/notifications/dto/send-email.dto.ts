import { IsEmail, IsString, IsOptional, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ example: 'Willkommen bei Elbfunkeln' })
  @IsString()
  subject: string;

  @ApiPropertyOptional({ example: 'Hallo und willkommen!' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ example: '<h1>Willkommen!</h1>' })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional({ 
    example: ['cc@example.com'],
    description: 'CC-Empfänger' 
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @ApiPropertyOptional({ 
    example: ['bcc@example.com'],
    description: 'BCC-Empfänger' 
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @ApiPropertyOptional({
    description: 'Template-Variablen',
    example: { name: 'Max', orderNumber: 'ELB-2024-001' }
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}