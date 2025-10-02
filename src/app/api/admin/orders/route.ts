import { NextRequest } from 'next/server';
import { requireShopOwner } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { paginatedResponse, serverErrorResponse } from '@/utils/response';
import { Prisma } from '@prisma/client';

/**
 * GET /api/admin/orders
 * Get all orders (Admin/Shop Owner only)
 */
async function getAllOrders(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status as any;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus as any;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        {
          user: {
            OR: [
              { email: { contains: search } },
              { firstName: { contains: search } },
              { lastName: { contains: search } },
            ],
          },
        },
      ];
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

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
                  images: true,
                },
              },
            },
          },
          shippingAddress: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.order.count({ where }),
    ]);

    // Parse data
    const ordersWithParsedData = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        total: Number(item.total),
        product: {
          ...item.product,
          images: JSON.parse(item.product.images),
        },
      })),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      tax: Number(order.tax),
      discount: Number(order.discount),
      total: Number(order.total),
    }));

    return paginatedResponse(ordersWithParsedData, page, limit, total);
  } catch (error) {
    console.error('Get admin orders error:', error);
    return serverErrorResponse('Failed to fetch orders');
  }
}

export const GET = requireShopOwner(getAllOrders);