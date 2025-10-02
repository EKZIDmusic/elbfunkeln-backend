import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { updateCartItemSchema } from '@/utils/validation';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

/**
 * PUT /api/cart/items/[id]
 * Update cart item quantity
 */
async function updateCartItem(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = (req as any).user;
    const { id } = params;
    const body = await req.json();
    const data = updateCartItemSchema.parse(body);

    // Find cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
        product: {
          select: {
            stock: true,
          },
        },
      },
    });

    if (!cartItem) {
      return notFoundResponse('Cart item not found');
    }

    // Check if item belongs to user's cart
    if (cartItem.cart.userId !== user.id) {
      return errorResponse('Unauthorized', 403);
    }

    // Check stock availability
    if (cartItem.product.stock < data.quantity) {
      return errorResponse(`Only ${cartItem.product.stock} items available`, 400);
    }

    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity: data.quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
          },
        },
      },
    });

    // Parse images
    const itemWithParsedImages = {
      ...updatedItem,
      product: {
        ...updatedItem.product,
        images: JSON.parse(updatedItem.product.images),
        price: Number(updatedItem.product.price),
      },
    };

    return successResponse(itemWithParsedImages);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Update cart item error:', error);
    return serverErrorResponse('Failed to update cart item');
  }
}

/**
 * DELETE /api/cart/items/[id]
 * Remove item from cart
 */
async function deleteCartItem(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = (req as any).user;
    const { id } = params;

    // Find cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      return notFoundResponse('Cart item not found');
    }

    // Check if item belongs to user's cart
    if (cartItem.cart.userId !== user.id) {
      return errorResponse('Unauthorized', 403);
    }

    // Delete item
    await prisma.cartItem.delete({
      where: { id },
    });

    return successResponse({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Delete cart item error:', error);
    return serverErrorResponse('Failed to remove item from cart');
  }
}

export const PUT = requireAuth(updateCartItem);
export const DELETE = requireAuth(deleteCartItem);