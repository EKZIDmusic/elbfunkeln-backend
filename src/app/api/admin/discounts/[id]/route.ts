import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { requireAdmin } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

const updateDiscountSchema = z.object({
  code: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  value: z.number().positive().optional(),
  minPurchase: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  active: z.boolean().optional(),
});

/**
 * PUT /api/admin/discounts/[id]
 * Update a discount (Admin only)
 */
async function updateDiscount(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const data = updateDiscountSchema.parse(body);

    const existing = await prisma.discount.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse('Discount not found');
    }

    const updateData: any = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.minPurchase !== undefined) updateData.minPurchase = data.minPurchase;
    if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
    if (data.startsAt !== undefined) updateData.startsAt = new Date(data.startsAt);
    if (data.expiresAt !== undefined) updateData.expiresAt = new Date(data.expiresAt);
    if (data.active !== undefined) updateData.active = data.active;

    const discount = await prisma.discount.update({
      where: { id },
      data: updateData,
    });

    return successResponse({
      ...discount,
      value: Number(discount.value),
      minPurchase: discount.minPurchase ? Number(discount.minPurchase) : null,
      maxDiscount: discount.maxDiscount ? Number(discount.maxDiscount) : null,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Update discount error:', error);
    return serverErrorResponse('Failed to update discount');
  }
}

/**
 * DELETE /api/admin/discounts/[id]
 * Delete a discount (Admin only)
 */
async function deleteDiscount(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const discount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      return notFoundResponse('Discount not found');
    }

    await prisma.discount.delete({
      where: { id },
    });

    return successResponse({ message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Delete discount error:', error);
    return serverErrorResponse('Failed to delete discount');
  }
}

export const PUT = requireAdmin(updateDiscount);
export const DELETE = requireAdmin(deleteDiscount);