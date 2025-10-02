import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, serverErrorResponse } from '@/utils/response';

/**
 * GET /api/products/featured
 * Get featured products
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 50);

    const products = await prisma.product.findMany({
      where: {
        featured: true,
        active: true,
        stock: { gt: 0 },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const productsWithParsedData = products.map((product) => ({
      ...product,
      images: JSON.parse(product.images),
      metadata: product.metadata ? JSON.parse(product.metadata) : null,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    }));

    return successResponse(productsWithParsedData);
  } catch (error) {
    console.error('Get featured products error:', error);
    return serverErrorResponse('Failed to fetch featured products');
  }
}