import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { createDiscountSchema } from '@/utils/validation';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
  paginatedResponse,
} from '@/utils/response';

/**
 * GET /api/admin/discounts
 * Get all discounts (Admin only)
 */
async function getDiscounts(req: NextRequest) {
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

    const [discounts, total] = await Promise.all([
      prisma.discount.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.discount.count({ where }),
    ]);

    const discountsWithNumbers = discounts.map((discount) => ({
      ...discount,
      value: Number(discount.value),
      minPurchase: discount.minPurchase ? Number(discount.minPurchase) : null,
      maxDiscount: discount.maxDiscount ? Number(discount.maxDiscount) : null,
    }));

    return paginatedResponse(discountsWithNumbers, page, limit, total);
  } catch (error) {
    console.error('Get discounts error:', error);
    return serverErrorResponse('Failed to fetch discounts');
  }
}

/**
 * POST /api/admin/discounts
 * Create a discount code (Admin only)
 */
async function createDiscount(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createDiscountSchema.parse(body);

    // Check if code already exists
    const existing = await prisma.discount.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return errorResponse('Discount code already exists', 409);
    }

    // Create discount
    const discount = await prisma.discount.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        minPurchase: data.minPurchase,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        active: data.active !== undefined ? data.active : true,
      },
    });

    return successResponse(
      {
        ...discount,
        value: Number(discount.value),
        minPurchase: discount.minPurchase ? Number(discount.minPurchase) : null,
        maxDiscount: discount.maxDiscount ? Number(discount.maxDiscount) : null,
      },
      201
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Create discount error:', error);
    return serverErrorResponse('Failed to create discount');
  }
}

export const GET = requireAdmin(getDiscounts);
export const POST = requireAdmin(createDiscount);