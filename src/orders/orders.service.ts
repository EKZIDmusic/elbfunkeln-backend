import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';
import { OrderFilterDto, UpdateOrderStatusDto, UpdateTrackingDto } from './dto/order-filter.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { generateOrderNumber } from '../common/utils/helpers';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // ==================== CUSTOMER ENDPOINTS ====================

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const {
      shippingAddress,
      billingAddress,
      paymentMethod,
      discountCode,
      customerNote,
    } = createOrderDto;

    // Get user's cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate cart items (stock, availability)
    for (const item of cart.items) {
      if (item.product.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Product "${item.product.name}" is no longer available`,
        );
      }

      if (item.product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${item.product.name}". Only ${item.product.stockQuantity} available`,
        );
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce((total, item) => {
      return total + Number(item.product.price) * item.quantity;
    }, 0);

    const taxRate = 0.19; // 19% German VAT
    const taxAmount = subtotal * taxRate;
    const shippingCost = 4.99; // TODO: Calculate based on shipping method
    let discountAmount = 0;

    // Apply discount code
    let discountCodeId: string | undefined;
    if (discountCode) {
      const discount = await this.prisma.discountCode.findUnique({
        where: { code: discountCode },
      });

      if (discount && discount.isActive) {
        const now = new Date();
        if (now >= discount.validFrom && now <= discount.validUntil) {
          if (
            !discount.maxUses ||
            discount.usedCount < discount.maxUses
          ) {
            if (
              !discount.minOrderAmount ||
              subtotal >= Number(discount.minOrderAmount)
            ) {
              discountCodeId = discount.id;

              if (discount.type === 'PERCENTAGE') {
                discountAmount = (subtotal * Number(discount.value)) / 100;
              } else if (discount.type === 'FIXED_AMOUNT') {
                discountAmount = Number(discount.value);
              } else if (discount.type === 'FREE_SHIPPING') {
                discountAmount = shippingCost;
              }
            }
          }
        }
      }
    }

    const total = subtotal + taxAmount + shippingCost - discountAmount;

    // Create order with transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create addresses
      const shippingAddr = await tx.address.create({
        data: {
          ...shippingAddress,
          type: 'shipping',
          userId,
        },
      });

      const billingAddr = await tx.address.create({
        data: {
          ...billingAddress,
          type: 'billing',
          userId,
        },
      });

      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          shippingAddressId: shippingAddr.id,
          billingAddressId: billingAddr.id,
          subtotal,
          taxAmount,
          shippingCost,
          discountAmount,
          total,
          paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          status: OrderStatus.PENDING,
          customerNote,
          discountCodeId,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
              subtotal: Number(item.product.price) * item.quantity,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          shippingAddress: true,
          billingAddress: true,
        },
      });

      // Update product stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Update discount code usage
      if (discountCodeId) {
        await tx.discountCode.update({
          where: { id: discountCodeId },
          data: {
            usedCount: { increment: 1 },
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // TODO: Send order confirmation email
    // TODO: Create payment intent if needed

    return order;
  }

  async findUserOrders(userId: string, filterDto: OrderFilterDto) {
    const { page = 1, limit = 10, status, paymentStatus, sortBy = 'createdAt', sortOrder = 'desc' } = filterDto;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { userId };

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const total = await this.prisma.order.count({ where });

    const orders = await this.prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isMain: true },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
      },
    });

    return new PaginatedResponseDto(orders, total, page, limit);
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isMain: true },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        discountCode: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.findOne(userId, orderId);

    // Only pending or confirmed orders can be cancelled
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException(
        'Order cannot be cancelled at this stage',
      );
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    // Restore product stock
    await this.restoreStock(orderId);

    // TODO: Process refund if payment was made

    return updatedOrder;
  }

  // ==================== ADMIN ENDPOINTS ====================

  async findAll(filterDto: OrderFilterDto) {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const total = await this.prisma.order.count({ where });

    const orders = await this.prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        shippingAddress: true,
      },
    });

    return new PaginatedResponseDto(orders, total, page, limit);
  }

  async findOneAdmin(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        discountCode: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(orderId: string, updateStatusDto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const { status, internalNote } = updateStatusDto;

    const updateData: any = {
      status,
      internalNote,
    };

    // Set timestamps based on status
    if (status === OrderStatus.SHIPPED && !order.shippedAt) {
      updateData.shippedAt = new Date();
    } else if (status === OrderStatus.DELIVERED && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    } else if (status === OrderStatus.CANCELLED && !order.cancelledAt) {
      updateData.cancelledAt = new Date();
      // Restore stock
      await this.restoreStock(orderId);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // TODO: Send status update email to customer

    return updatedOrder;
  }

  async updateTracking(orderId: string, updateTrackingDto: UpdateTrackingDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        ...updateTrackingDto,
        status: OrderStatus.SHIPPED,
        shippedAt: new Date(),
      },
    });
  }

  async getOrderStats() {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      todayOrders,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.PROCESSING } }),
      this.prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: PaymentStatus.PAID },
      }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      todayOrders,
    };
  }

  // ==================== HELPERS ====================

  private async restoreStock(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return;

    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
        },
      });
    }
  }
}