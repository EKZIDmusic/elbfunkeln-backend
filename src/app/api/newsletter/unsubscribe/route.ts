import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

const unsubscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * POST /api/newsletter/unsubscribe
 * Unsubscribe from newsletter
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = unsubscribeSchema.parse(body);

    // Find subscription
    const subscription = await prisma.newsletterSubscription.findUnique({
      where: { email: data.email },
    });

    if (!subscription) {
      return notFoundResponse('Email not found in newsletter list');
    }

    if (!subscription.active) {
      return errorResponse('Email is already unsubscribed', 400);
    }

    // Deactivate subscription
    await prisma.newsletterSubscription.update({
      where: { email: data.email },
      data: {
        active: false,
        unsubscribedAt: new Date(),
      },
    });

    return successResponse({
      message: 'Successfully unsubscribed from newsletter',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Newsletter unsubscribe error:', error);
    return serverErrorResponse('Failed to unsubscribe from newsletter');
  }
}