import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  shippingAddressId: string;

  @ApiProperty()
  @IsString()
  billingAddressId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerNote?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  discountCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shippingMethod?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ],
  })
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  internalNote?: string;
}

export class UpdateTrackingDto {
  @ApiProperty()
  @IsString()
  trackingNumber: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  trackingUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shippingMethod?: string;
}
