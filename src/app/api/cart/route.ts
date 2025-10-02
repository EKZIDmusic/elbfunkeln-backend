import { NextRequest } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, serverErrorResponse } from '@/utils/response';

/**
 * GET /api/cart
 * Get current user's cart
 */
async function getCart(req: NextRequest) {
  try {
    const user = (req as any).user;

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                comparePrice: true,
                images: true,
                stock: true,
                active: true,
              },
            },
          },
        },
      },
    });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: user.id,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  comparePrice: true,
                  images: true,
                  stock: true,
                  active: true,
                },
              },
            },
          },
        },
      });
    }

    // Calculate cart totals
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    const tax = subtotal * 0.19; // 19% German VAT
    const shipping = subtotal > 50 ? 0 : 4.99; // Free shipping over 50€
    const total = subtotal + tax + shipping;

    // Parse images for products
    const itemsWithParsedImages = cart.items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        images: JSON.parse(item.product.images),
        price: Number(item.product.price),
        comparePrice: item.product.comparePrice ? Number(item.product.comparePrice) : null,
      },
    }));

    return successResponse({
      items: itemsWithParsedImages,
      summary: {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        total: Math.round(total * 100) / 100,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return serverErrorResponse('Failed to fetch cart');
  }
}

/**
 * DELETE /api/cart
 * Clear cart
 */
async function clearCart(req: NextRequest) {
  try {
    const user = (req as any).user;

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: user.id,
        },
      },
    });

    return successResponse({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    return serverErrorResponse('Failed to clear cart');
  }
}

export const GET = requireAuth(getCart);
export const DELETE = requireAuth(clearCart);