import { NextRequest } from 'next/server';
import { requireAdmin } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, serverErrorResponse } from '@/utils/response';

/**
 * GET /api/admin/stats
 * Get overall system statistics (Admin only)
 */
async function getStats(req: NextRequest) {
  try {
    // Get counts in parallel
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      activeProducts,
      pendingOrders,
      openTickets,
      newsletterSubscribers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { total: true },
      }),
      prisma.product.count({ where: { active: true } }),
      prisma.order.count({
        where: { status: { in: ['PENDING', 'PROCESSING'] } },
      }),
      prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.newsletterSubscription.count({ where: { active: true } }),
    ]);

    // Recent activity
    const recentOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
        },
      },
    });

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    // Low stock products
    const lowStockProducts = await prisma.product.count({
      where: {
        active: true,
        stock: { lte: 10 },
      },
    });

    // Order status distribution
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    const stats = {
      overview: {
        totalUsers,
        totalProducts,
        activeProducts,
        totalOrders,
        totalRevenue: Math.round(Number(totalRevenue._sum.total || 0) * 100) / 100,
      },
      pending: {
        orders: pendingOrders,
        tickets: openTickets,
        lowStockProducts,
      },
      recent24h: {
        orders: recentOrders,
        newUsers: recentUsers,
      },
      marketing: {
        newsletterSubscribers,
      },
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
    };

    return successResponse(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    return serverErrorResponse('Failed to fetch statistics');
  }
}

export const GET = requireAdmin(getStats);