import { Order, OrderStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderEntity implements Order {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  shippingAddressId: string;

  @ApiProperty()
  billingAddressId: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: 'Zwischensumme (ohne Versand und MwSt.)' })
  subtotal: number;

  @ApiProperty({ description: 'MwSt. (19%)' })
  tax: number;

  @ApiProperty({ description: 'Versandkosten' })
  shippingCost: number;

  @ApiProperty({ description: 'Rabatt' })
  discountAmount: number;

  @ApiProperty({ description: 'Gesamtbetrag' })
  total: number;

  @ApiPropertyOptional()
  discountCode: string | null;

  @ApiProperty()
  paymentMethod: string;

  @ApiPropertyOptional()
  stripePaymentIntentId: string | null;

  @ApiProperty()
  isPaid: boolean;

  @ApiPropertyOptional()
  paidAt: Date | null;

  @ApiPropertyOptional()
  trackingNumber: string | null;

  @ApiPropertyOptional()
  notes: string | null;

  @ApiPropertyOptional()
  adminNotes: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<OrderEntity>) {
    Object.assign(this, partial);
  }

  // Computed properties
  @ApiProperty()
  get canBeCancelled(): boolean {
    return (
      this.status === OrderStatus.PENDING ||
      this.status === OrderStatus.CONFIRMED
    );
  }

  @ApiProperty()
  get isInProgress(): boolean {
    return (
      this.status === OrderStatus.PROCESSING ||
      this.status === OrderStatus.SHIPPED
    );
  }

  @ApiProperty()
  get isCompleted(): boolean {
    return this.status === OrderStatus.DELIVERED;
  }

  @ApiProperty()
  get isCancelled(): boolean {
    return this.status === OrderStatus.CANCELLED;
  }
}
