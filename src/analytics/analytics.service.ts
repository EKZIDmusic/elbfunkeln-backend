import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackEventDto, AnalyticsFilterDto } from './dto/analytics.dto';
import { getDateRange } from '../common/utils/date.utils';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  async trackEvent(
    trackEventDto: TrackEventDto,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const { eventType, eventData, sessionId } = trackEventDto;

    await this.prisma.analyticsEvent.create({
      data: {
        eventType,
        eventData: JSON.stringify(eventData),
        userId,
        sessionId,
        ipAddress,
        userAgent,
      },
    });

    return { message: 'Event tracked successfully' };
  }

  // ==================== ADMIN ENDPOINTS ====================

  async getDashboard(filterDto: AnalyticsFilterDto) {
    const { startDate, endDate } = this.getDateRange(filterDto);

    const [revenue, orders, customers, products] = await Promise.all([
      this.getRevenueStats(startDate, endDate),
      this.getOrderStats(startDate, endDate),
      this.getCustomerStats(startDate, endDate),
      this.getProductStats(startDate, endDate),
    ]);

    return {
      period: {
        startDate,
        endDate,
      },
      revenue,
      orders,
      customers,
      products,
    };
  }

  async getSalesStats(filterDto: AnalyticsFilterDto) {
    const { startDate, endDate } = this.getDateRange(filterDto);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        paymentStatus: PaymentStatus.PAID,
      },
      select: {
        total: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            subtotal: true,
          },
        },
      },
    });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Revenue by day
    const revenueByDay = this.groupByDay(orders, startDate, endDate);

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueByDay,
    };
  }

  async getTrafficStats(filterDto: AnalyticsFilterDto) {
    const { startDate, endDate } = this.getDateRange(filterDto);

    const [pageViews, productViews, searches] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: {
          eventType: 'page_view',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.analyticsEvent.count({
        where: {
          eventType: 'product_view',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.analyticsEvent.count({
        where: {
          eventType: 'search',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    // Unique sessions
    const uniqueSessions = await this.prisma.analyticsEvent.groupBy({
      by: ['sessionId'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        sessionId: { not: null },
      },
      _count: true,
    });

    return {
      pageViews,
      productViews,
      searches,
      uniqueSessions: uniqueSessions.length,
    };
  }

  async getProductPerformance() {
    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          subtotal: 'desc',
        },
      },
      take: 10,
    });

    const productsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            images: {
              where: { isMain: true },
              take: 1,
            },
          },
        });

        return {
          product,
          totalQuantity: item._sum.quantity || 0,
          totalRevenue: Number(item._sum.subtotal || 0),
          orderCount: item._count,
        };
      }),
    );

    return productsWithDetails;
  }

  // ==================== HELPERS ====================

  private getDateRange(filterDto: AnalyticsFilterDto) {
    if (filterDto.startDate && filterDto.endDate) {
      return {
        startDate: new Date(filterDto.startDate),
        endDate: new Date(filterDto.endDate),
      };
    }

    if (filterDto.period) {
      return getDateRange(filterDto.period);
    }

    // Default to last 30 days
    return getDateRange('last30days');
  }

  private async getRevenueStats(startDate: Date, endDate: Date) {
    const result = await this.prisma.order.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        paymentStatus: PaymentStatus.PAID,
      },
      _sum: {
        total: true,
        subtotal: true,
        taxAmount: true,
      },
      _count: true,
    });

    return {
      total: Number(result._sum.total || 0),
      subtotal: Number(result._sum.subtotal || 0),
      tax: Number(result._sum.taxAmount || 0),
      orderCount: result._count,
    };
  }

  private async getOrderStats(startDate: Date, endDate: Date) {
    const [
      total,
      pending,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
    ] = await Promise.all([
      this.prisma.order.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: OrderStatus.PENDING,
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: OrderStatus.CONFIRMED,
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: OrderStatus.PROCESSING,
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: OrderStatus.SHIPPED,
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: OrderStatus.DELIVERED,
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: OrderStatus.CANCELLED,
        },
      }),
    ]);

    return {
      total,
      pending,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
    };
  }

  private async getCustomerStats(startDate: Date, endDate: Date) {
    const newCustomers = await this.prisma.user.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        role: 'CUSTOMER',
      },
    });

    const returningCustomers = await this.prisma.user.count({
      where: {
        createdAt: { lt: startDate },
        orders: {
          some: {
            createdAt: { gte: startDate, lte: endDate },
          },
        },
      },
    });

    return {
      new: newCustomers,
      returning: returningCustomers,
      total: newCustomers + returningCustomers,
    };
  }

  private async getProductStats(startDate: Date, endDate: Date) {
    const [totalProducts, activeProducts, outOfStock, lowStock] =
      await Promise.all([
        this.prisma.product.count(),
        this.prisma.product.count({
          where: { status: 'ACTIVE' },
        }),
        this.prisma.product.count({
          where: { status: 'OUT_OF_STOCK' },
        }),
        this.prisma.product.count({
          where: {
            status: 'ACTIVE',
            stockQuantity: { lte: 5, gt: 0 },
          },
        }),
      ]);

    return {
      total: totalProducts,
      active: activeProducts,
      outOfStock,
      lowStock,
    };
  }

  private groupByDay(
    orders: any[],
    startDate: Date,
    endDate: Date,
  ): Array<{ date: string; revenue: number; orders: number }> {
    const dayMap = new Map<string, { revenue: number; orders: number }>();

    // Initialize all days in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dayMap.set(dateStr, { revenue: 0, orders: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate orders by day
    orders.forEach((order) => {
      const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
      const day = dayMap.get(dateStr);
      if (day) {
        day.revenue += Number(order.total);
        day.orders += 1;
      }
    });

    return Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }
}
