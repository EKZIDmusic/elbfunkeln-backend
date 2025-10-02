import { NextRequest } from 'next/server';
import { requireAdmin } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, serverErrorResponse } from '@/utils/response';
import { subDays, eachDayOfInterval, format } from 'date-fns';

/**
 * GET /api/admin/analytics/sales
 * Get sales analytics (Admin only)
 */
async function getSalesAnalytics(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Sales by day
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        paymentStatus: 'COMPLETED',
      },
      select: {
        createdAt: true,
        total: true,
      },
    });

    // Group by day
    const dayInterval = eachDayOfInterval({ start: startDate, end: endDate });
    const salesByDay = dayInterval.map((day) => {
      const dayOrders = orders.filter(
        (order) =>
          format(order.createdAt, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      const revenue = dayOrders.reduce(
        (sum, order) => sum + Number(order.total),
        0
      );
      return {
        date: format(day, 'yyyy-MM-dd'),
        orders: dayOrders.length,
        revenue: Math.round(revenue * 100) / 100,
      };
    });

    // Sales by category
    const salesByCategory = await prisma.$queryRaw<
      Array<{ categoryName: string; revenue: number; orders: number }>
    >`
      SELECT 
        c.name as categoryName,
        SUM(oi.total) as revenue,
        COUNT(DISTINCT o.id) as orders
      FROM Order o
      JOIN OrderItem oi ON oi.orderId = o.id
      JOIN Product p ON p.id = oi.productId
      JOIN Category c ON c.id = p.categoryId
      WHERE o.createdAt >= ${startDate}
        AND o.createdAt <= ${endDate}
        AND o.paymentStatus = 'COMPLETED'
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;

    // Top selling products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: startDate, lte: endDate },
          paymentStatus: 'COMPLETED',
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });

    const productIds = topProducts.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
      },
    });

    const topProductsWithDetails = topProducts.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        id: item.productId,
        name: product?.name || 'Unknown',
        price: product ? Number(product.price) : 0,
        image: product ? JSON.parse(product.images)[0] : null,
        quantitySold: item._sum.quantity,
        revenue: Number(item._sum.total || 0),
      };
    });

    // Payment methods distribution
    const paymentMethods = await prisma.order.groupBy({
      by: ['paymentStatus'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
      _sum: {
        total: true,
      },
    });

    return successResponse({
      period: {
        startDate,
        endDate,
        days,
      },
      salesByDay,
      salesByCategory: salesByCategory.map((item) => ({
        category: item.categoryName,
        revenue: Number(item.revenue),
        orders: Number(item.orders),
      })),
      topProducts: topProductsWithDetails,
      paymentMethods: paymentMethods.map((item) => ({
        status: item.paymentStatus,
        count: item._count,
        total: Number(item._sum.total || 0),
      })),
    });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    return serverErrorResponse('Failed to fetch sales analytics');
  }
}

export const GET = requireAdmin(getSalesAnalytics);