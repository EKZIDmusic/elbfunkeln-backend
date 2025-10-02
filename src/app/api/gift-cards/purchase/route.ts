import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { purchaseGiftCardSchema } from '@/utils/validation';
import {
  successResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/gift-cards/purchase
 * Purchase a gift card
 */
async function purchaseGiftCard(req: NextRequest) {
  try {
    const user = (req as any).user;
    const body = await req.json();
    const data = purchaseGiftCardSchema.parse(body);

    // Generate unique gift card code
    const code = `ELBFUNKELN-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Set expiration date (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Create gift card
    const giftCard = await prisma.giftCard.create({
      data: {
        code,
        amount: data.amount,
        balance: data.amount,
        purchaserId: user.id,
        recipientEmail: data.recipientEmail,
        recipientName: data.recipientName,
        message: data.message,
        expiresAt,
        active: true,
      },
    });

    // TODO: Send gift card email to recipient
    // if (data.recipientEmail) {
    //   await sendGiftCardEmail(data.recipientEmail, giftCard);
    // }

    return successResponse(
      {
        ...giftCard,
        amount: Number(giftCard.amount),
        balance: Number(giftCard.balance),
      },
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Purchase gift card error:', error);
    return serverErrorResponse('Failed to purchase gift card');
  }
}

export const POST = requireAuth(purchaseGiftCard);