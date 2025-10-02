import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/utils/response';

/**
 * GET /api/gift-cards/validate/[code]
 * Validate a gift card code
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    const giftCard = await prisma.giftCard.findUnique({
      where: { code },
    });

    if (!giftCard) {
      return notFoundResponse('Gift card not found');
    }

    // Check if active
    if (!giftCard.active) {
      return errorResponse('Gift card is not active', 400);
    }

    // Check if expired
    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      return errorResponse('Gift card has expired', 400);
    }

    // Check if balance is zero
    if (Number(giftCard.balance) <= 0) {
      return errorResponse('Gift card has no remaining balance', 400);
    }

    return successResponse({
      valid: true,
      code: giftCard.code,
      balance: Number(giftCard.balance),
      expiresAt: giftCard.expiresAt,
    });
  } catch (error) {
    console.error('Validate gift card error:', error);
    return serverErrorResponse('Failed to validate gift card');
  }
}