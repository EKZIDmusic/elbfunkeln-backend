import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { requireAdmin } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  validationErrorResponse,
  serverErrorResponse,
  paginatedResponse,
} from '@/utils/response';
import { v4 as uuidv4 } from 'uuid';

const createGiftCardSchema = z.object({
  amount: z.number().positive(),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().optional(),
  message: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

/**
 * GET /api/admin/gift-cards
 * Get all gift cards (Admin only)
 */
async function getGiftCards(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const active = searchParams.get('active');

    const where: any = {};
    if (active !== null && active !== undefined) {
      where.active = active === 'true';
    }

    const [giftCards, total] = await Promise.all([
      prisma.giftCard.findMany({
        where,
        include: {
          purchaser: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.giftCard.count({ where }),
    ]);

    const giftCardsWithNumbers = giftCards.map((card) => ({
      ...card,
      amount: Number(card.amount),
      balance: Number(card.balance),
    }));

    return paginatedResponse(giftCardsWithNumbers, page, limit, total);
  } catch (error) {
    console.error('Get gift cards error:', error);
    return serverErrorResponse('Failed to fetch gift cards');
  }
}

/**
 * POST /api/admin/gift-cards
 * Create a gift card manually (Admin only)
 */
async function createGiftCard(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createGiftCardSchema.parse(body);

    const code = `ELBFUNKELN-${uuidv4().substring(0, 8).toUpperCase()}`;

    const expiresAt = data.expiresAt
      ? new Date(data.expiresAt)
      : (() => {
          const date = new Date();
          date.setFullYear(date.getFullYear() + 1);
          return date;
        })();

    const giftCard = await prisma.giftCard.create({
      data: {
        code,
        amount: data.amount,
        balance: data.amount,
        recipientEmail: data.recipientEmail,
        recipientName: data.recipientName,
        message: data.message,
        expiresAt,
        active: true,
      },
    });

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

    console.error('Create gift card error:', error);
    return serverErrorResponse('Failed to create gift card');
  }
}

export const GET = requireAdmin(getGiftCards);
export const POST = requireAdmin(createGiftCard);