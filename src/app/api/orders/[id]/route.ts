import { NextRequest } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/utils/response';

/**
 * GET /api/orders/[id]
 * Get single order details
 */
async function getOrder(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = (req as any).user;
    const { id } = params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                sku: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Check if order belongs to user (or user is admin)
    if (order.userId !== user.id && user.role !== 'ADMIN') {
      return errorResponse('Unauthorized', 403);
    }

    // Parse data
    const orderWithParsedData = {
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
    };

    return successResponse(orderWithParsedData);
  } catch (error) {
    console.error('Get order error:', error);
    return serverErrorResponse('Failed to fetch order');
  }
}

export const GET = requireAuth(getOrder);