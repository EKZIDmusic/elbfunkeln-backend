import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { ProductStatus, Prisma } from '@prisma/client';
import { slugify } from '../common/utils/helpers';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  async findAll(filterDto: ProductFilterDto) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      status,
      minPrice,
      maxPrice,
      material,
      isFeatured,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      // Public endpoints only show active products
      status: status || ProductStatus.ACTIVE,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    if (material) {
      where.material = { contains: material, mode: 'insensitive' };
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (inStock) {
      where.stockQuantity = { gt: 0 };
    }

    // Get total count
    const total = await this.prisma.product.count({ where });

    // Get products
    const products = await this.prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
          },
        },
      },
    });

    return new PaginatedResponseDto(products, total, page, limit);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Calculate average rating
    const avgRating = await this.prisma.review.aggregate({
      where: {
        productId: id,
        isApproved: true,
      },
      _avg: {
        rating: true,
      },
    });

    return {
      ...product,
      averageRating: avgRating._avg.rating || 0,
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findFeatured(limit: number = 8) {
    return this.prisma.product.findMany({
      where: {
        isFeatured: true,
        status: ProductStatus.ACTIVE,
        stockQuantity: { gt: 0 },
      },
      take: limit,
      include: {
        images: {
          where: { isMain: true },
          take: 1,
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchProducts(query: string, limit: number = 10) {
    return this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: {
          where: { isMain: true },
          take: 1,
        },
      },
    });
  }

  // ==================== ADMIN ENDPOINTS ====================

  async create(createProductDto: CreateProductDto) {
    const slug = slugify(createProductDto.name);

    // Check if slug exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      throw new ConflictException(
        'Product with this name already exists. Please use a different name.',
      );
    }

    // Generate SKU if not provided
    const sku = `PROD-${Date.now()}`;

    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        slug,
        sku,
      },
      include: {
        category: true,
        images: true,
      },
    });

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // Check if product exists
    await this.findOne(id);

    // If name is being updated, regenerate slug
    let slug: string | undefined;
    if (updateProductDto.name) {
      slug = slugify(updateProductDto.name);

      // Check if new slug conflicts with another product
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (existingProduct) {
        throw new ConflictException('A product with this name already exists');
      }
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        ...(slug && { slug }),
      },
      include: {
        category: true,
        images: true,
      },
    });

    return product;
  }

  async remove(id: string) {
    // Check if product exists
    await this.findOne(id);

    // Check if product is in any active orders
    const ordersWithProduct = await this.prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          status: {
            in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
          },
        },
      },
    });

    if (ordersWithProduct > 0) {
      throw new BadRequestException(
        'Cannot delete product with active orders. Set status to INACTIVE instead.',
      );
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Product successfully deleted' };
  }

  async updateStock(id: string, quantity: number) {
    const product = await this.findOne(id);

    const newQuantity = product.stockQuantity + quantity;

    if (newQuantity < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    // Auto-update status based on stock
    let status = product.status;
    if (newQuantity === 0 && status === ProductStatus.ACTIVE) {
      status = ProductStatus.OUT_OF_STOCK;
    } else if (newQuantity > 0 && status === ProductStatus.OUT_OF_STOCK) {
      status = ProductStatus.ACTIVE;
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        stockQuantity: newQuantity,
        status,
      },
    });
  }

  async getLowStockProducts() {
    return this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        stockQuantity: {
          lte: this.prisma.product.fields.lowStockThreshold,
          gt: 0,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { stockQuantity: 'asc' },
    });
  }

  async getInventoryStats() {
    const [totalProducts, activeProducts, outOfStock, lowStock, totalValue] =
      await Promise.all([
        this.prisma.product.count(),
        this.prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
        this.prisma.product.count({
          where: { status: ProductStatus.OUT_OF_STOCK },
        }),
        this.prisma.product.count({
          where: {
            status: ProductStatus.ACTIVE,
            stockQuantity: {
              lte: 5,
              gt: 0,
            },
          },
        }),
        this.prisma.product.aggregate({
          _sum: {
            price: true,
          },
          where: {
            status: ProductStatus.ACTIVE,
          },
        }),
      ]);

    return {
      totalProducts,
      activeProducts,
      outOfStock,
      lowStock,
      totalValue: totalValue._sum.price || 0,
    };
  }
}
