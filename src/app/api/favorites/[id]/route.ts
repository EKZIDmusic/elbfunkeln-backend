import { NextRequest } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/utils/response';

/**
 * DELETE /api/favorites/[id]
 * Remove product from favorites
 */
async function removeFavorite(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = (req as any).user;
    const { id } = params;

    // Find favorite
    const favorite = await prisma.favorite.findUnique({
      where: { id },
    });

    if (!favorite) {
      return notFoundResponse('Favorite not found');
    }

    // Check if favorite belongs to user
    if (favorite.userId !== user.id) {
      return errorResponse('Unauthorized', 403);
    }

    // Delete favorite
    await prisma.favorite.delete({
      where: { id },
    });

    return successResponse({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return serverErrorResponse('Failed to remove favorite');
  }
}

export const DELETE = requireAuth(removeFavorite);