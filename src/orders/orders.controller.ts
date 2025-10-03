import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/order.dto';
import { OrderFilterDto, UpdateOrderStatusDto, UpdateTrackingDto } from './dto/order-filter.dto';
import { GetUser, Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { UserRole } from '@prisma/client';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order from cart' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(
    @GetUser('id') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(userId, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  findUserOrders(
    @GetUser('id') userId: string,
    @Query() filterDto: OrderFilterDto,
  ) {
    return this.ordersService.findUserOrders(userId, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(
    @GetUser('id') userId: string,
    @Param('id', ParseUuidPipe) orderId: string,
  ) {
    return this.ordersService.findOne(userId, orderId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  cancelOrder(
    @GetUser('id') userId: string,
    @Param('id', ParseUuidPipe) orderId: string,
  ) {
    return this.ordersService.cancelOrder(userId, orderId);
  }
}

@ApiTags('Admin - Orders')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SHOP_OWNER)
@ApiBearerAuth()
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders (Admin)' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  findAll(@Query() filterDto: OrderFilterDto) {
    return this.ordersService.findAll(filterDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  getOrderStats() {
    return this.ordersService.getOrderStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details (Admin)' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id', ParseUuidPipe) orderId: string) {
    return this.ordersService.findOneAdmin(orderId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (Admin)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateStatus(
    @Param('id', ParseUuidPipe) orderId: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(orderId, updateStatusDto);
  }

  @Patch(':id/tracking')
  @ApiOperation({ summary: 'Update tracking information (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Tracking updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateTracking(
    @Param('id', ParseUuidPipe) orderId: string,
    @Body() updateTrackingDto: UpdateTrackingDto,
  ) {
    return this.ordersService.updateTracking(orderId, updateTrackingDto);
  }
}