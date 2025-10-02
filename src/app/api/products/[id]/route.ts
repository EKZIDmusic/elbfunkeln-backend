import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundResponse, serverErrorResponse } from '@/utils/response';

/**
 * GET /api/products/[id]
 * Get single product by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { 
        id,
        active: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        reviews: {
          where: {
            verified: true,
          },
          select: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!product) {
      return notFoundResponse('Product not found');
    }

    // Calculate average rating
    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

    // Parse JSON fields
    const productWithParsedData = {
      ...product,
      images: JSON.parse(product.images),
      metadata: product.metadata ? JSON.parse(product.metadata) : null,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: product.reviews.length,
    };

    return successResponse(productWithParsedData);
  } catch (error) {
    console.error('Product fetch error:', error);
    return serverErrorResponse('Failed to fetch product');
  }
}