import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import {
  CreateDiscountDto,
  UpdateDiscountDto,
  ValidateDiscountDto,
} from './dto/discount.dto';
import { Public, Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { UserRole } from '@prisma/client';

@ApiTags('Discounts')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Public()
  @Post('validate')
  @ApiOperation({ summary: 'Validate discount code' })
  @ApiResponse({ status: 200, description: 'Discount code is valid' })
  @ApiResponse({ status: 400, description: 'Invalid discount code' })
  @ApiResponse({ status: 404, description: 'Discount code not found' })
  validateDiscount(@Body() validateDiscountDto: ValidateDiscountDto) {
    return this.discountsService.validateDiscount(validateDiscountDto);
  }
}

@ApiTags('Admin - Discounts')
@Controller('admin/discounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SHOP_OWNER)
@ApiBearerAuth()
export class AdminDiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create discount code (Admin)' })
  @ApiResponse({
    status: 201,
    description: 'Discount code created successfully',
  })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  create(@Body() createDiscountDto: CreateDiscountDto) {
    return this.discountsService.create(createDiscountDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all discount codes (Admin)' })
  @ApiResponse({ status: 200, description: 'Discount codes retrieved' })
  findAll() {
    return this.discountsService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get discount statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  getStats() {
    return this.discountsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get discount code details (Admin)' })
  @ApiResponse({ status: 200, description: 'Discount code retrieved' })
  @ApiResponse({ status: 404, description: 'Discount code not found' })
  findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.discountsService.findOne(id);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get discount usage stats (Admin)' })
  @ApiResponse({ status: 200, description: 'Usage stats retrieved' })
  getUsageStats(@Param('id', ParseUuidPipe) id: string) {
    return this.discountsService.getUsageStats(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update discount code (Admin)' })
  @ApiResponse({ status: 200, description: 'Discount code updated' })
  @ApiResponse({ status: 404, description: 'Discount code not found' })
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ) {
    return this.discountsService.update(id, updateDiscountDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete discount code (Admin)' })
  @ApiResponse({ status: 200, description: 'Discount code deleted' })
  @ApiResponse({ status: 400, description: 'Code has been used' })
  remove(@Param('id', ParseUuidPipe) id: string) {
    return this.discountsService.remove(id);
  }
}