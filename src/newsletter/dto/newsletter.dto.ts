import { IsEmail, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscribeNewsletterDto {
  @ApiProperty({ example: 'max@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Max' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Mustermann' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
}

export class UnsubscribeNewsletterDto {
  @ApiProperty({ example: 'max@example.com' })
  @IsEmail()
  email: string;
}

export class CreateCampaignDto {
  @ApiProperty({ example: 'Summer Sale 2024' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: '🌞 Sommer-Sale: Bis zu 30% Rabatt!' })
  @IsString()
  @MaxLength(200)
  subject: string;

  @ApiProperty({ example: '<h1>Willkommen zum Summer Sale!</h1><p>...</p>' })
  @IsString()
  content: string;
}

export class SendCampaignDto {
  @ApiProperty({ example: 'campaign-uuid' })
  @IsString()
  campaignId: string;
}
