import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { createOrderSchema } from '@/utils/validation';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
  paginatedResponse,
} from '@/utils/response';

/**
 * POST /api/orders
 * Create a new order from cart
 */
async function createOrder(req: NextRequest) {
  try {
    const user = (req as any).user;
    const body = await req.json();
    const data = createOrderSchema.parse(body);

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return errorResponse('Cart is empty', 400);
    }

    // Verify addresses belong to user
    const [shippingAddress, billingAddress] = await Promise.all([
      prisma.address.findFirst({
        where: { id: data.shippingAddressId, userId: user.id },
      }),
      prisma.address.findFirst({
        where: { id: data.billingAddressId, userId: user.id },
      }),
    ]);

    if (!shippingAddress || !billingAddress) {
      return errorResponse('Invalid address', 400);
    }

    // Check stock availability
    for (const item of cart.items) {
      if (!item.product.active) {
        return errorResponse(`Product ${item.product.name} is not available`, 400);
      }
      if (item.product.stock < item.quantity) {
        return errorResponse(
          `Insufficient stock for ${item.product.name}. Only ${item.product.stock} available`,
          400
        );
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    const shippingCost = subtotal > 50 ? 0 : 4.99;
    const tax = subtotal * 0.19; // 19% German VAT

    let discount = 0;
    if (data.discountCode) {
      const discountRecord = await prisma.discount.findUnique({
        where: { code: data.discountCode, active: true },
      });

      if (discountRecord) {
        const now = new Date();
        const isValid =
          (!discountRecord.startsAt || discountRecord.startsAt <= now) &&
          (!discountRecord.expiresAt || discountRecord.expiresAt >= now) &&
          (!discountRecord.usageLimit || discountRecord.usageCount < discountRecord.usageLimit) &&
          (!discountRecord.minPurchase || subtotal >= Number(discountRecord.minPurchase));

        if (isValid) {
          if (discountRecord.type === 'PERCENTAGE') {
            discount = subtotal * (Number(discountRecord.value) / 100);
            if (discountRecord.maxDiscount) {
              discount = Math.min(discount, Number(discountRecord.maxDiscount));
            }
          } else {
            discount = Number(discountRecord.value);
          }
        }
      }
    }

    const total = subtotal + shippingCost + tax - discount;

    // Generate order number
    const orderNumber = `ELB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          subtotal,
          shipping: shippingCost,
          tax,
          discount,
          total,
          shippingAddressId: data.shippingAddressId,
          billingAddressId: data.billingAddressId,
          shippingMethod: data.shippingMethod,
          discountCode: data.discountCode,
          notes: data.notes,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: Number(item.product.price),
              total: Number(item.product.price) * item.quantity,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
        },
      });

      // Update product stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Update discount usage count
      if (data.discountCode) {
        await tx.discount.updateMany({
          where: { code: data.discountCode },
          data: {
            usageCount: {
              increment: 1,
            },
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // Parse images
    const orderWithParsedImages = {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        total: Number(item.total),
        product: {
          ...item.product,
          images: JSON.parse(item.product.images),
        },
      })),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      tax: Number(order.tax),
      discount: Number(order.discount),
      total: Number(order.total),
    };

    // Send order confirmation email (async, don't wait)
    const { sendOrderConfirmation } = await import('@/lib/email');
    sendOrderConfirmation(user.email, order).catch((error) => {
      console.error('Failed to send order confirmation email:', error);
    });

    return successResponse(orderWithParsedImages, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Create order error:', error);
    return serverErrorResponse('Failed to create order');
  }
}

/**
 * GET /api/orders
 * Get user's orders with pagination
 */
async function getOrders(req: NextRequest) {
  try {
    const user = (req as any).user;
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
          shippingAddress: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId: user.id } }),
    ]);

    // Parse data
    const ordersWithParsedData = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        total: Number(item.total),
        product: {
          ...item.product,
          images: JSON.parse(item.product.images),
        },
      })),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      tax: Number(order.tax),
      discount: Number(order.discount),
      total: Number(order.total),
    }));

    return paginatedResponse(ordersWithParsedData, page, limit, total);
  } catch (error) {
    console.error('Get orders error:', error);
    return serverErrorResponse('Failed to fetch orders');
  }
}

export const POST = requireAuth(createOrder);
export const GET = requireAuth(getOrders);