import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, serverErrorResponse } from '@/utils/response';

/**
 * GET /api/categories
 * Get all categories (public)
 */
export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
        _count: {
          select: {
            products: {
              where: {
                active: true,
              },
            },
          },
        },
      },
      where: {
        parentId: null, // Only root categories
      },
      orderBy: {
        name: 'asc',
      },
    });

    const categoriesWithCount = categories.map((category) => ({
      ...category,
      productCount: category._count.products,
    }));

    return successResponse(categoriesWithCount);
  } catch (error) {
    console.error('Get categories error:', error);
    return serverErrorResponse('Failed to fetch categories');
  }
}