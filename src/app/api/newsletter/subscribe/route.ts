import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { subscribeNewsletterSchema } from '@/utils/validation';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

/**
 * POST /api/newsletter/subscribe
 * Subscribe to newsletter
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = subscribeNewsletterSchema.parse(body);

    // Check if email already subscribed
    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      if (existing.active) {
        return errorResponse('Email already subscribed', 409);
      }

      // Reactivate subscription
      const subscription = await prisma.newsletterSubscription.update({
        where: { email: data.email },
        data: {
          active: true,
          firstName: data.firstName || existing.firstName,
          lastName: data.lastName || existing.lastName,
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
      });

      return successResponse({
        message: 'Successfully resubscribed to newsletter',
        subscription,
      });
    }

    // Create new subscription
    const subscription = await prisma.newsletterSubscription.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        active: true,
      },
    });

    return successResponse(
      {
        message: 'Successfully subscribed to newsletter',
        subscription,
      },
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Newsletter subscribe error:', error);
    return serverErrorResponse('Failed to subscribe to newsletter');
  }
}