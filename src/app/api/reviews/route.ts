import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { createReviewSchema } from '@/utils/validation';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
  paginatedResponse,
} from '@/utils/response';

/**
 * GET /api/reviews
 * Get reviews (optionally filtered by product)
 */
async function getReviews(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const skip = (page - 1) * limit;

    const where: any = {
      verified: true,
    };

    if (productId) {
      where.productId = productId;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    // Parse product images
    const reviewsWithParsedData = reviews.map((review) => ({
      ...review,
      product: {
        ...review.product,
        images: JSON.parse(review.product.images),
      },
    }));

    return paginatedResponse(reviewsWithParsedData, page, limit, total);
  } catch (error) {
    console.error('Get reviews error:', error);
    return serverErrorResponse('Failed to fetch reviews');
  }
}

/**
 * POST /api/reviews
 * Create a new review
 */
async function createReview(req: NextRequest) {
  try {
    const user = (req as any).user;
    const body = await req.json();
    const data = createReviewSchema.parse(body);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { id: true, active: true },
    });

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: user.id,
        productId: data.productId,
      },
    });

    if (existingReview) {
      return errorResponse('You have already reviewed this product', 409);
    }

    // Check if user has purchased this product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: data.productId,
        order: {
          userId: user.id,
          status: 'DELIVERED',
        },
      },
    });

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: data.productId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        verified: hasPurchased !== null, // Mark as verified if user purchased
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
    });

    // Parse product images
    const reviewWithParsedData = {
      ...review,
      product: {
        ...review.product,
        images: JSON.parse(review.product.images),
      },
    };

    return successResponse(reviewWithParsedData, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Create review error:', error);
    return serverErrorResponse('Failed to create review');
  }
}

export const GET = getReviews;
export const POST = requireAuth(createReview);