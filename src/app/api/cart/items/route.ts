import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { addToCartSchema } from '@/utils/validation';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

/**
 * POST /api/cart/items
 * Add item to cart
 */
async function addToCart(req: NextRequest) {
  try {
    const user = (req as any).user;
    const body = await req.json();
    const data = addToCartSchema.parse(body);

    // Check if product exists and is available
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: {
        id: true,
        active: true,
        stock: true,
      },
    });

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    if (!product.active) {
      return errorResponse('Product is not available', 400);
    }

    if (product.stock < data.quantity) {
      return errorResponse(`Only ${product.stock} items available in stock`, 400);
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
      });
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: data.productId,
        },
      },
    });

    let cartItem;

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + data.quantity;

      if (product.stock < newQuantity) {
        return errorResponse(`Only ${product.stock} items available in stock`, 400);
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
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
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: data.productId,
          quantity: data.quantity,
        },
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
    }

    // Parse images
    const itemWithParsedImages = {
      ...cartItem,
      product: {
        ...cartItem.product,
        images: JSON.parse(cartItem.product.images),
        price: Number(cartItem.product.price),
      },
    };

    return successResponse(itemWithParsedImages, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Add to cart error:', error);
    return serverErrorResponse('Failed to add item to cart');
  }
}

export const POST = requireAuth(addToCart);