import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

const addFavoriteSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
});

/**
 * GET /api/favorites
 * Get user's favorite products
 */
async function getFavorites(req: NextRequest) {
  try {
    const user = (req as any).user;

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse product images
    const favoritesWithParsedData = favorites.map((favorite) => ({
      ...favorite,
      product: {
        ...favorite.product,
        images: JSON.parse(favorite.product.images),
        metadata: favorite.product.metadata
          ? JSON.parse(favorite.product.metadata)
          : null,
        price: Number(favorite.product.price),
        comparePrice: favorite.product.comparePrice
          ? Number(favorite.product.comparePrice)
          : null,
      },
    }));

    return successResponse(favoritesWithParsedData);
  } catch (error) {
    console.error('Get favorites error:', error);
    return serverErrorResponse('Failed to fetch favorites');
  }
}

/**
 * POST /api/favorites
 * Add product to favorites
 */
async function addFavorite(req: NextRequest) {
  try {
    const user = (req as any).user;
    const body = await req.json();
    const data = addFavoriteSchema.parse(body);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { id: true, active: true },
    });

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    if (!product.active) {
      return errorResponse('Product is not available', 400);
    }

    // Check if already in favorites
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: data.productId,
        },
      },
    });

    if (existingFavorite) {
      return errorResponse('Product already in favorites', 409);
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId: user.id,
        productId: data.productId,
      },
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    // Parse product images
    const favoriteWithParsedData = {
      ...favorite,
      product: {
        ...favorite.product,
        images: JSON.parse(favorite.product.images),
        metadata: favorite.product.metadata
          ? JSON.parse(favorite.product.metadata)
          : null,
        price: Number(favorite.product.price),
        comparePrice: favorite.product.comparePrice
          ? Number(favorite.product.comparePrice)
          : null,
      },
    };

    return successResponse(favoriteWithParsedData, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Add favorite error:', error);
    return serverErrorResponse('Failed to add favorite');
  }
}

export const GET = requireAuth(getFavorites);
export const POST = requireAuth(addFavorite);