import {
  IsString,
  IsOptional,
  IsObject,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EventType {
  PAGE_VIEW = 'page_view',
  PRODUCT_VIEW = 'product_view',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  CHECKOUT_START = 'checkout_start',
  PURCHASE = 'purchase',
  SEARCH = 'search',
}

export class TrackEventDto {
  @ApiProperty({ enum: EventType, example: EventType.PRODUCT_VIEW })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiProperty({
    example: { productId: 'prod-123', productName: 'Drahtring' },
  })
  @IsObject()
  eventData: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export enum DateRangeType {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last7days',
  LAST_30_DAYS = 'last30days',
  THIS_MONTH = 'thisMonth',
  LAST_MONTH = 'lastMonth',
}

export class AnalyticsFilterDto {
  @ApiPropertyOptional({ enum: DateRangeType })
  @IsOptional()
  @IsEnum(DateRangeType)
  period?: DateRangeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
