import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class ApplyDiscountDto {
  @ApiProperty()
  @IsString()
  code: string;
}

export class CartSummaryDto {
  items: CartItemSummaryDto[];
  totalItems: number;
  totalProducts: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  discount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CartItemSummaryDto {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  stock: number;
  isAvailable: boolean;
}
