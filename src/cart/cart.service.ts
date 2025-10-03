import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartSummaryDto, CartItemSummaryDto } from './dto/cart-summary.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create cart for user
   */
  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1 },
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
                  images: { take: 1 },
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  /**
   * Get cart summary
   */
  async getCart(userId: string): Promise<CartSummaryDto> {
    const cart = await this.getOrCreateCart(userId);
    return this.calculateCartSummary(cart);
  }

  /**
   * Add product to cart
   */
  async addItem(userId: string, addToCartDto: AddToCartDto) {
    const { productId, quantity } = addToCartDto;

    // Check if product exists and is available
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produkt nicht gefunden');
    }

    if (!product.isActive) {
      throw new BadRequestException('Produkt ist nicht verfügbar');
    }

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Nicht genügend Lagerbestand. Verfügbar: ${product.stock}`,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = cart.items.find(
      (item) => item.productId === productId,
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        throw new BadRequestException(
          `Nicht genügend Lagerbestand. Verfügbar: ${product.stock}`,
        );
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          price: product.price, // Update price in case it changed
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.price,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Update cart item quantity
   */
  async updateItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const { quantity } = updateCartItemDto;

    const cart = await this.getOrCreateCart(userId);

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Artikel nicht im Warenkorb gefunden');
    }

    // Check stock availability
    const product = await this.prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product) {
      throw new NotFoundException('Produkt nicht mehr verfügbar');
    }

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Nicht genügend Lagerbestand. Verfügbar: ${product.stock}`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity,
        price: product.price, // Update price
      },
    });

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Artikel nicht im Warenkorb gefunden');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'Warenkorb geleert' };
  }

  /**
   * Apply discount code
   */
  async applyDiscount(userId: string, code: string) {
    const cart = await this.getOrCreateCart(userId);

    // Validate discount code (TODO: Implement discount validation)
    // This is a placeholder - will be implemented in Discounts module
    const discount = await this.validateDiscountCode(code);

    if (!discount) {
      throw new BadRequestException('Ungültiger Rabattcode');
    }

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        discountCode: code,
        discountAmount: discount.amount,
      },
    });

    return this.getCart(userId);
  }

  /**
   * Remove discount
   */
  async removeDiscount(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        discountCode: null,
        discountAmount: null,
      },
    });

    return this.getCart(userId);
  }

  /**
   * Calculate cart summary with totals
   */
  private calculateCartSummary(cart: any): CartSummaryDto {
    const items: CartItemSummaryDto[] = cart.items.map((item: any) => ({
      id: item.id,
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.images[0]?.url || null,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
      stock: item.product.stock,
      isAvailable: item.product.isActive && item.product.stock > 0,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = cart.discountAmount || 0;
    const subtotalAfterDiscount = Math.max(0, subtotal - discount);

    // German VAT: 19%
    const tax = subtotalAfterDiscount * 0.19;

    // Shipping calculation (simplified)
    const shipping = subtotal >= 50 ? 0 : 4.99; // Free shipping over 50€

    const total = subtotalAfterDiscount + shipping;

    return {
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      totalProducts: items.length,
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      total: Number(total.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  /**
   * Validate discount code (placeholder)
   */
  private async validateDiscountCode(code: string) {
    // TODO: Implement actual discount validation
    // This will be implemented in the Discounts module
    return null;
  }

  /**
   * Check if cart is valid for checkout
   */
  async validateCartForCheckout(userId: string) {
    const cart = await this.getCart(userId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Warenkorb ist leer');
    }

    // Check if all items are available and in stock
    for (const item of cart.items) {
      if (!item.isAvailable) {
        throw new BadRequestException(
          `Produkt "${item.productName}" ist nicht mehr verfügbar`,
        );
      }

      if (item.stock < item.quantity) {
        throw new BadRequestException(
          `Nicht genügend Lagerbestand für "${item.productName}". Verfügbar: ${item.stock}`,
        );
      }
    }

    return { valid: true, cart };
  }
}