import { NextRequest } from 'next/server';
import { requireAdmin } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, serverErrorResponse } from '@/utils/response';
import { subDays, startOfDay, endOfDay } from 'date-fns';

/**
 * GET /api/admin/analytics/dashboard
 * Get dashboard analytics (Admin only)
 */
async function getDashboard(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());
    
    // Previous period for comparison
    const prevStartDate = startOfDay(subDays(startDate, days));
    const prevEndDate = endOfDay(subDays(endDate, days));

    // Revenue data
    const [currentRevenue, previousRevenue] = await Promise.all([
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          paymentStatus: 'COMPLETED',
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: prevStartDate, lte: prevEndDate },
          paymentStatus: 'COMPLETED',
        },
        _sum: { total: true },
        _count: true,
      }),
    ]);

    const currentTotal = Number(currentRevenue._sum.total || 0);
    const previousTotal = Number(previousRevenue._sum.total || 0);
    const revenueGrowth = previousTotal > 0 
      ? ((currentTotal - previousTotal) / previousTotal) * 100 
      : 0;

    // Orders data
    const ordersGrowth = previousRevenue._count > 0
      ? ((currentRevenue._count - previousRevenue._count) / previousRevenue._count) * 100
      : 0;

    const avgOrderValue = currentRevenue._count > 0
      ? currentTotal / currentRevenue._count
      : 0;

    // Customer data
    const [newCustomers, totalCustomers] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          role: 'CUSTOMER',
        },
      }),
      prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),
    ]);

    // Orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
    });

    // Top products
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
          total: 'desc',
        },
      },
      take: 10,
    });

    // Get product details
    const productIds = topProducts.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, images: true },
    });

    const topProductsWithDetails = topProducts.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        name: product?.name || 'Unknown',
        image: product ? JSON.parse(product.images)[0] : null,
        quantity: item._sum.quantity,
        revenue: Number(item._sum.total || 0),
      };
    });

    // Conversion rate (orders / visitors)
    // Note: This would need actual visitor tracking
    const conversionRate = 2.5; // Placeholder

    const dashboard = {
      period: {
        days,
        startDate,
        endDate,
      },
      revenue: {
        current: Math.round(currentTotal * 100) / 100,
        previous: Math.round(previousTotal * 100) / 100,
        growth: Math.round(revenueGrowth * 10) / 10,
        currency: 'EUR',
      },
      orders: {
        current: currentRevenue._count,
        previous: previousRevenue._count,
        growth: Math.round(ordersGrowth * 10) / 10,
        avgValue: Math.round(avgOrderValue * 100) / 100,
      },
      customers: {
        new: newCustomers,
        total: totalCustomers,
      },
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      topProducts: topProductsWithDetails,
      conversionRate: conversionRate,
    };

    return successResponse(dashboard);
  } catch (error) {
    console.error('Get dashboard error:', error);
    return serverErrorResponse('Failed to fetch dashboard data');
  }
}

export const GET = requireAdmin(getDashboard);