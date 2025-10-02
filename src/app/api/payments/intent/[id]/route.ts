import { NextRequest } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { getPaymentIntent } from '@/lib/stripe';
import {
  successResponse,
  serverErrorResponse,
} from '@/utils/response';

/**
 * GET /api/payments/intent/[id]
 * Get payment intent status
 */
async function getIntentStatus(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get payment intent from Stripe
    const paymentIntent = await getPaymentIntent(id);

    return successResponse({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
      metadata: paymentIntent.metadata,
    });
  } catch (error) {
    console.error('Get payment intent error:', error);
    return serverErrorResponse('Failed to fetch payment intent');
  }
}

export const GET = requireAuth(getIntentStatus);