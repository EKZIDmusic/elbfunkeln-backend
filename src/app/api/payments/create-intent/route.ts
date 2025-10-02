import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { createPaymentIntent } from '@/lib/stripe';
import { createPaymentIntentSchema } from '@/utils/validation';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

/**
 * POST /api/payments/create-intent
 * Create a Stripe payment intent for an order
 */
async function createIntent(req: NextRequest) {
  try {
    const user = (req as any).user;
    const body = await req.json();
    const data = createPaymentIntentSchema.parse(body);

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        total: true,
        status: true,
        paymentStatus: true,
        paymentIntentId: true,
      },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    // Check if order belongs to user
    if (order.userId !== user.id) {
      return errorResponse('Unauthorized', 403);
    }

    // Check if order is already paid
    if (order.paymentStatus === 'COMPLETED') {
      return errorResponse('Order is already paid', 400);
    }

    // Check if order is cancelled
    if (order.status === 'CANCELLED') {
      return errorResponse('Cannot pay for cancelled order', 400);
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      amount: data.amount,
      currency: data.currency || 'eur',
      orderId: order.id,
      customerEmail: user.email,
      metadata: {
        orderNumber: order.orderNumber,
        userId: user.id,
        ...data.metadata,
      },
    });

    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentIntentId: paymentIntent.id,
      },
    });

    return successResponse({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Create payment intent error:', error);
    return serverErrorResponse('Failed to create payment intent');
  }
}

export const POST = requireAuth(createIntent);