import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { Public, Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { UserRole } from '@prisma/client';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all products with filters' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  findAll(@Query() filterDto: ProductFilterDto) {
    return this.productsService.findAll(filterDto);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiResponse({
    status: 200,
    description: 'Featured products retrieved successfully',
  })
  findFeatured(@Query('limit') limit?: number) {
    return this.productsService.findFeatured(limit);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  searchProducts(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.searchProducts(query, limit);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}

@ApiTags('Admin - Products')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SHOP_OWNER)
@ApiBearerAuth()
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new product (Admin/Shop Owner)' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 409, description: 'Product already exists' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product (Admin/Shop Owner)' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product (Admin/Shop Owner)' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id', ParseUuidPipe) id: string) {
    return this.productsService.remove(id);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Update product stock (Admin/Shop Owner)' })
  @ApiResponse({ status: 200, description: 'Stock updated successfully' })
  updateStock(
    @Param('id', ParseUuidPipe) id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.productsService.updateStock(id, quantity);
  }

  @Get('inventory/low-stock')
  @ApiOperation({ summary: 'Get low stock products (Admin/Shop Owner)' })
  @ApiResponse({
    status: 200,
    description: 'Low stock products retrieved successfully',
  })
  getLowStockProducts() {
    return this.productsService.getLowStockProducts();
  }

  @Get('inventory/stats')
  @ApiOperation({ summary: 'Get inventory statistics (Admin/Shop Owner)' })
  @ApiResponse({
    status: 200,
    description: 'Inventory stats retrieved successfully',
  })
  getInventoryStats() {
    return this.productsService.getInventoryStats();
  }
}