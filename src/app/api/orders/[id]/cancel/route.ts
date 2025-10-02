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
 * PUT /api/orders/[id]/cancel
 * Cancel an order
 */
async function cancelOrder(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = (req as any).user;
    const { id } = params;

    // Find order
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Check if order belongs to user
    if (order.userId !== user.id && user.role !== 'ADMIN') {
      return errorResponse('Unauthorized', 403);
    }

    // Check if order can be cancelled
    if (order.status === 'CANCELLED') {
      return errorResponse('Order is already cancelled', 400);
    }

    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      return errorResponse('Cannot cancel shipped or delivered orders', 400);
    }

    // Update order in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          paymentStatus: order.paymentStatus === 'COMPLETED' ? 'REFUNDED' : order.paymentStatus,
        },
        include: {
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
      });

      // Restore product stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      return updated;
    });

    // Parse data
    const orderWithParsedData = {
      ...updatedOrder,
      items: updatedOrder.items.map((item) => ({
        ...item,
        price: Number(item.price),
        total: Number(item.total),
        product: {
          ...item.product,
          images: JSON.parse(item.product.images),
        },
      })),
      subtotal: Number(updatedOrder.subtotal),
      shipping: Number(updatedOrder.shipping),
      tax: Number(updatedOrder.tax),
      discount: Number(updatedOrder.discount),
      total: Number(updatedOrder.total),
    };

    return successResponse(orderWithParsedData);
  } catch (error) {
    console.error('Cancel order error:', error);
    return serverErrorResponse('Failed to cancel order');
  }
}

export const PUT = requireAuth(cancelOrder);