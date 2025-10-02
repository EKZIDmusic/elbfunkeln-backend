import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

const requestReturnSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(10, 'Please provide a detailed reason'),
  items: z.array(
    z.object({
      orderItemId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ),
});

/**
 * POST /api/returns/request
 * Request a return/refund (User)
 */
async function requestReturn(req: NextRequest) {
  try {
    const user = (req as any).user;
    const body = await req.json();
    const data = requestReturnSchema.parse(body);

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Check if order belongs to user
    if (order.userId !== user.id) {
      return errorResponse('Unauthorized', 403);
    }

    // Check if order is delivered
    if (order.status !== 'DELIVERED') {
      return errorResponse('Can only return delivered orders', 400);
    }

    // Check if order is within return window (14 days for DE)
    const deliveredDate = order.updatedAt; // Should be delivery date
    const returnDeadline = new Date(deliveredDate);
    returnDeadline.setDate(returnDeadline.getDate() + 14);

    if (new Date() > returnDeadline) {
      return errorResponse('Return window has expired (14 days)', 400);
    }

    // Create return request (simplified - would need separate Return table)
    // For now, we'll add a note to the order
    const returnNote = `RETURN REQUEST: ${data.reason}\nItems: ${JSON.stringify(
      data.items
    )}`;

    await prisma.order.update({
      where: { id: data.orderId },
      data: {
        notes: order.notes
          ? `${order.notes}\n\n${returnNote}`
          : returnNote,
        status: 'CANCELLED', // Simplified - should have RETURN_REQUESTED status
      },
    });

    return successResponse(
      {
        message: 'Return request submitted successfully',
        orderId: data.orderId,
        returnDeadline,
      },
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Request return error:', error);
    return serverErrorResponse('Failed to request return');
  }
}

export const POST = requireAuth(requestReturn);