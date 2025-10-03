import {
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TicketStatus, TicketPriority } from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty({ example: 'Problem mit meiner Bestellung' })
  @IsString()
  @MaxLength(200)
  subject: string;

  @ApiProperty({ example: 'Ich habe meine Bestellung noch nicht erhalten...' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority = TicketPriority.MEDIUM;
}

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;
}

export class CreateTicketMessageDto {
  @ApiProperty({ example: 'Vielen Dank für Ihre Antwort...' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean = false;
}
