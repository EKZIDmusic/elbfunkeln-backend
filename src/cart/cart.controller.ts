import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { GetUser } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
  getCart(@GetUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get cart item count' })
  @ApiResponse({ status: 200, description: 'Item count retrieved' })
  getCartItemCount(@GetUser('id') userId: string) {
    return this.cartService.getCartItemCount(userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  addItem(
    @GetUser('id') userId: string,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addItem(userId, addToCartDto);
  }

  @Put('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  updateItem(
    @GetUser('id') userId: string,
    @Param('id', ParseUuidPipe) itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(userId, itemId, updateCartItemDto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed from cart' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  removeItem(
    @GetUser('id') userId: string,
    @Param('id', ParseUuidPipe) itemId: string,
  ) {
    return this.cartService.removeItem(userId, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
  clearCart(@GetUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate cart before checkout' })
  @ApiResponse({ status: 200, description: 'Cart validation result' })
  validateCart(@GetUser('id') userId: string) {
    return this.cartService.validateCart(userId);
  }
}