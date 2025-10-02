import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { optionalAuth } from '@/middleware/auth';
import {
  successResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

const trackEventSchema = z.object({
  eventType: z.string(),
  sessionId: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/analytics/track
 * Track analytics event
 */
async function trackEvent(req: NextRequest) {
  try {
    const user = (req as any).user;
    const body = await req.json();
    const data = trackEventSchema.parse(body);

    // Get IP and User Agent
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || undefined;

    // Create analytics event
    await prisma.analyticsEvent.create({
      data: {
        eventType: data.eventType,
        userId: user?.id,
        sessionId: data.sessionId,
        data: JSON.stringify(data.data || {}),
        ipAddress,
        userAgent,
      },
    });

    return successResponse({ tracked: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Track event error:', error);
    return serverErrorResponse('Failed to track event');
  }
}

export const POST = optionalAuth(trackEvent);