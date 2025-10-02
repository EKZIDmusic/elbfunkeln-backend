import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { requireShopOwner } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

const updateInventorySchema = z.object({
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  action: z.enum(['set', 'add', 'subtract']).optional(),
});

/**
 * PUT /api/admin/inventory/[id]
 * Update product inventory (Admin/Shop Owner only)
 */
async function updateInventory(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const data = updateInventorySchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, stock: true, name: true },
    });

    if (!product) {
      return notFoundResponse('Product not found');
    }

    let newStock = data.stock;

    // Calculate new stock based on action
    if (data.action === 'add') {
      newStock = product.stock + data.stock;
    } else if (data.action === 'subtract') {
      newStock = Math.max(0, product.stock - data.stock);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { stock: newStock },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        price: true,
        active: true,
      },
    });

    return successResponse({
      ...updatedProduct,
      price: Number(updatedProduct.price),
      previousStock: product.stock,
      newStock,
      change: newStock - product.stock,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Update inventory error:', error);
    return serverErrorResponse('Failed to update inventory');
  }
}

export const PUT = requireShopOwner(updateInventory);