import { Cart } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartEntity implements Cart {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  discountCode: string | null;

  @ApiPropertyOptional()
  discountAmount: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<CartEntity>) {
    Object.assign(this, partial);
  }
}