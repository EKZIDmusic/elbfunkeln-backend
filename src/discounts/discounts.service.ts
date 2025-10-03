import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDiscountDto,
  UpdateDiscountDto,
  ValidateDiscountDto,
} from './dto/discount.dto';

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  async validateDiscount(validateDiscountDto: ValidateDiscountDto) {
    const { code, orderAmount = 0 } = validateDiscountDto;

    const discount = await this.prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discount) {
      throw new NotFoundException('Discount code not found');
    }

    if (!discount.isActive) {
      throw new BadRequestException('Discount code is not active');
    }

    const now = new Date();

    if (now < discount.validFrom) {
      throw new BadRequestException('Discount code is not yet valid');
    }

    if (now > discount.validUntil) {
      throw new BadRequestException('Discount code has expired');
    }

    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      throw new BadRequestException('Discount code usage limit reached');
    }

    if (
      discount.minOrderAmount &&
      orderAmount < Number(discount.minOrderAmount)
    ) {
      throw new BadRequestException(
        `Minimum order amount is €${Number(discount.minOrderAmount).toFixed(2)}`,
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'PERCENTAGE') {
      discountAmount = (orderAmount * Number(discount.value)) / 100;
    } else if (discount.type === 'FIXED_AMOUNT') {
      discountAmount = Number(discount.value);
    }

    return {
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: Number(discount.value),
        discountAmount,
      },
    };
  }

  // ==================== ADMIN ENDPOINTS ====================

  async create(createDiscountDto: CreateDiscountDto) {
    const codeUpper = createDiscountDto.code.toUpperCase();

    // Check if code already exists
    const existingCode = await this.prisma.discountCode.findUnique({
      where: { code: codeUpper },
    });

    if (existingCode) {
      throw new ConflictException('Discount code already exists');
    }

    // Validate dates
    const validFrom = new Date(createDiscountDto.validFrom);
    const validUntil = new Date(createDiscountDto.validUntil);

    if (validFrom >= validUntil) {
      throw new BadRequestException(
        'Valid from date must be before valid until date',
      );
    }

    return this.prisma.discountCode.create({
      data: {
        ...createDiscountDto,
        code: codeUpper,
        validFrom,
        validUntil,
      },
    });
  }

  async findAll() {
    return this.prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const discount = await this.prisma.discountCode.findUnique({
      where: { id },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!discount) {
      throw new NotFoundException('Discount code not found');
    }

    return discount;
  }

  async update(id: string, updateDiscountDto: UpdateDiscountDto) {
    const discount = await this.findOne(id);

    let codeUpper: string | undefined;
    if (updateDiscountDto.code) {
      codeUpper = updateDiscountDto.code.toUpperCase();

      // Check if new code conflicts with another discount
      if (codeUpper !== discount.code) {
        const existingCode = await this.prisma.discountCode.findUnique({
          where: { code: codeUpper },
        });

        if (existingCode) {
          throw new ConflictException('Discount code already exists');
        }
      }
    }

    // Validate dates if both are provided
    if (updateDiscountDto.validFrom && updateDiscountDto.validUntil) {
      const validFrom = new Date(updateDiscountDto.validFrom);
      const validUntil = new Date(updateDiscountDto.validUntil);

      if (validFrom >= validUntil) {
        throw new BadRequestException(
          'Valid from date must be before valid until date',
        );
      }
    }

    const updateData: any = { ...updateDiscountDto };

    if (codeUpper) {
      updateData.code = codeUpper;
    }

    if (updateDiscountDto.validFrom) {
      updateData.validFrom = new Date(updateDiscountDto.validFrom);
    }

    if (updateDiscountDto.validUntil) {
      updateData.validUntil = new Date(updateDiscountDto.validUntil);
    }

    return this.prisma.discountCode.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const discount = await this.findOne(id);

    // Check if discount is used in any orders
    if (discount._count.orders > 0) {
      throw new BadRequestException(
        'Cannot delete discount code that has been used. Set it to inactive instead.',
      );
    }

    await this.prisma.discountCode.delete({
      where: { id },
    });

    return { message: 'Discount code deleted successfully' };
  }

  async getUsageStats(id: string) {
    const discount = await this.findOne(id);

    const orders = await this.prisma.order.findMany({
      where: { discountCodeId: id },
      select: {
        total: true,
        discountAmount: true,
        createdAt: true,
      },
    });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );
    const totalDiscount = orders.reduce(
      (sum, order) => sum + Number(order.discountAmount),
      0,
    );

    return {
      code: discount.code,
      timesUsed: discount.usedCount,
      maxUses: discount.maxUses,
      ordersCount: orders.length,
      totalRevenue,
      totalDiscount,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      isActive: discount.isActive,
    };
  }

  async getStats() {
    const [totalCodes, activeCodes, expiredCodes, usedAmount] =
      await Promise.all([
        this.prisma.discountCode.count(),
        this.prisma.discountCode.count({
          where: {
            isActive: true,
            validUntil: { gte: new Date() },
          },
        }),
        this.prisma.discountCode.count({
          where: {
            validUntil: { lt: new Date() },
          },
        }),
        this.prisma.order.aggregate({
          _sum: { discountAmount: true },
          where: {
            discountCodeId: { not: null },
          },
        }),
      ]);

    return {
      totalCodes,
      activeCodes,
      expiredCodes,
      totalDiscountUsed: usedAmount._sum.discountAmount || 0,
    };
  }
}