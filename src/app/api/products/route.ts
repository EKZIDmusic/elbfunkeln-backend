import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paginatedResponse, serverErrorResponse } from '@/utils/response';
import { Prisma } from '@prisma/client';

/**
 * GET /api/products
 * Get all products with filtering and pagination
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - category: string (category ID)
 * - featured: boolean
 * - search: string
 * - minPrice: number
 * - maxPrice: number
 * - sortBy: string (price, name, createdAt)
 * - sortOrder: string (asc, desc)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    // Filters
    const categoryId = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      active: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (featured) {
      where.featured = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sortBy === 'price' || sortBy === 'name' || sortBy === 'createdAt') {
      orderBy[sortBy] = sortOrder as 'asc' | 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Execute queries
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    // Parse images JSON for each product
    const productsWithParsedImages = products.map((product) => ({
      ...product,
      images: JSON.parse(product.images),
      metadata: product.metadata ? JSON.parse(product.metadata) : null,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    }));

    return paginatedResponse(productsWithParsedImages, page, limit, total);
  } catch (error) {
    console.error('Products fetch error:', error);
    return serverErrorResponse('Failed to fetch products');
  }
}