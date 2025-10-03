import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get cart' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
  async getCart(@GetUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  @ApiResponse({ status: 400, description: 'Invalid input or out of stock' })
  async addItem(
    @GetUser('id') userId: string,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addItem(userId, addToCartDto);
  }

  @Put('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async updateItem(
    @GetUser('id') userId: string,
    @Param('id') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(userId, itemId, updateCartItemDto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async removeItem(@GetUser('id') userId: string, @Param('id') itemId: string) {
    return this.cartService.removeItem(userId, itemId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
  async clearCart(@GetUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }

  @Post('discount/:code')
  @ApiOperation({ summary: 'Apply discount code' })
  @ApiResponse({ status: 200, description: 'Discount applied' })
  @ApiResponse({ status: 400, description: 'Invalid discount code' })
  async applyDiscount(
    @GetUser('id') userId: string,
    @Param('code') code: string,
  ) {
    return this.cartService.applyDiscount(userId, code);
  }

  @Delete('discount')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove discount' })
  @ApiResponse({ status: 200, description: 'Discount removed' })
  async removeDiscount(@GetUser('id') userId: string) {
    return this.cartService.removeDiscount(userId);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate cart for checkout' })
  @ApiResponse({ status: 200, description: 'Cart is valid' })
  @ApiResponse({ status: 400, description: 'Cart validation failed' })
  async validateCart(@GetUser('id') userId: string) {
    return this.cartService.validateCartForCheckout(userId);
  }
}
