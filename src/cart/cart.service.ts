import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { ProductStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // ==================== CART OPERATIONS ====================

  async getCart(userId: string) {
    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isMain: true },
                  take: 1,
                },
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isMain: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });
    }

    // Calculate totals
    const summary = this.calculateCartSummary(cart);

    return {
      ...cart,
      summary,
    };
  }

  async addItem(userId: string, addToCartDto: AddToCartDto) {
    const { productId, quantity } = addToCartDto;

    // Check if product exists and is available
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('Product is not available');
    }

    if (product.stockQuantity < quantity) {
      throw new BadRequestException(
        `Only ${product.stockQuantity} items available in stock`,
      );
    }

    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    // Check if item already in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stockQuantity) {
        throw new BadRequestException(
          `Cannot add ${quantity} more. Only ${product.stockQuantity - existingItem.quantity} items available`,
        );
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Add new item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const { quantity } = updateCartItemDto;

    // Get cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Get cart item
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: {
        product: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // If quantity is 0, remove item
    if (quantity === 0) {
      return this.removeItem(userId, itemId);
    }

    // Check stock availability
    if (quantity > cartItem.product.stockQuantity) {
      throw new BadRequestException(
        `Only ${cartItem.product.stockQuantity} items available in stock`,
      );
    }

    // Update quantity
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    // Get cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Check if item exists in cart
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Remove item
    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Delete all items
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'Cart cleared successfully' };
  }

  async validateCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const issues: Array<{
      itemId: string;
      productId: string;
      productName: string;
      issue: string;
    }> = [];

    // Check each item
    for (const item of cart.items) {
      // Check if product is active
      if (item.product.status !== ProductStatus.ACTIVE) {
        issues.push({
          itemId: item.id,
          productId: item.product.id,
          productName: item.product.name,
          issue: 'Product is no longer available',
        });
        continue;
      }

      // Check stock
      if (item.product.stockQuantity < item.quantity) {
        issues.push({
          itemId: item.id,
          productId: item.product.id,
          productName: item.product.name,
          issue: `Only ${item.product.stockQuantity} items available (requested ${item.quantity})`,
        });
      }
    }

    if (issues.length > 0) {
      return {
        valid: false,
        issues,
      };
    }

    return {
      valid: true,
      issues: [],
    };
  }

  // ==================== HELPERS ====================

  private calculateCartSummary(cart: any) {
    let subtotal = 0;
    let itemCount = 0;

    for (const item of cart.items) {
      const price = Number(item.product.price);
      const quantity = item.quantity;
      subtotal += price * quantity;
      itemCount += quantity;
    }

    const taxRate = 0.19; // 19% German VAT
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return {
      itemCount,
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  async getCartItemCount(userId: string): Promise<number> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (!cart) {
      return 0;
    }

    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }
}