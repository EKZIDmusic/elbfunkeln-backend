import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { requireShopOwner } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { sendShippingNotification } from '@/lib/email';
import {
  successResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * PUT /api/admin/orders/[id]
 * Update order status (Admin/Shop Owner only)
 */
async function updateOrder(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const data = updateOrderSchema.parse(body);

    // Find order
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Check if tracking number is being added and status is SHIPPED
    const shouldSendShippingEmail =
      data.trackingNumber &&
      data.trackingNumber !== order.trackingNumber &&
      (data.status === 'SHIPPED' || order.status === 'SHIPPED');

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: data.status,
        paymentStatus: data.paymentStatus,
        trackingNumber: data.trackingNumber,
        notes: data.notes,
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
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Send shipping notification email if tracking number was added
    if (shouldSendShippingEmail && data.trackingNumber) {
      sendShippingNotification(
        order.user.email,
        updatedOrder.orderNumber,
        data.trackingNumber
      ).catch((error) => {
        console.error('Failed to send shipping notification:', error);
      });
    }

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
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Update order error:', error);
    return serverErrorResponse('Failed to update order');
  }
}

export const PUT = requireShopOwner(updateOrder);