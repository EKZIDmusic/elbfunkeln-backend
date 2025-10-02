import { NextRequest } from 'next/server';
import { requireShopOwner } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { paginatedResponse, serverErrorResponse } from '@/utils/response';

/**
 * GET /api/admin/inventory
 * Get inventory overview (Admin/Shop Owner only)
 */
async function getInventory(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;
    const lowStock = searchParams.get('lowStock') === 'true';

    const where: any = {};

    if (lowStock) {
      where.stock = { lte: 10 };
      where.active = true;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          price: true,
          active: true,
          images: true,
          category: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          stock: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithParsedData = products.map((product) => ({
      ...product,
      images: JSON.parse(product.images),
      price: Number(product.price),
      stockStatus:
        product.stock === 0
          ? 'OUT_OF_STOCK'
          : product.stock <= 5
          ? 'CRITICAL'
          : product.stock <= 10
          ? 'LOW'
          : 'IN_STOCK',
    }));

    return paginatedResponse(productsWithParsedData, page, limit, total);
  } catch (error) {
    console.error('Get inventory error:', error);
    return serverErrorResponse('Failed to fetch inventory');
  }
}

export const GET = requireShopOwner(getInventory);