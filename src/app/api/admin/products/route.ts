import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireShopOwner } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { createProductSchema } from '@/utils/validation';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
  paginatedResponse,
} from '@/utils/response';

/**
 * POST /api/admin/products
 * Create a new product (Shop Owner/Admin only)
 */
async function createProduct(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createProductSchema.parse(body);

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (existingProduct) {
      return errorResponse('Product with this slug already exists', 409);
    }

    // Check if SKU already exists
    const existingSKU = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSKU) {
      return errorResponse('Product with this SKU already exists', 409);
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        comparePrice: data.comparePrice,
        sku: data.sku,
        stock: data.stock,
        categoryId: data.categoryId,
        featured: data.featured || false,
        active: data.active !== undefined ? data.active : true,
        weight: data.weight,
        images: JSON.stringify(data.images),
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Parse JSON fields
    const productWithParsedData = {
      ...product,
      images: JSON.parse(product.images),
      metadata: product.metadata ? JSON.parse(product.metadata) : null,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    };

    return successResponse(productWithParsedData, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Create product error:', error);
    return serverErrorResponse('Failed to create product');
  }
}

/**
 * GET /api/admin/products
 * Get all products including inactive ones (Admin/Shop Owner only)
 */
async function getProducts(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    const categoryId = searchParams.get('category');
    const search = searchParams.get('search');
    const active = searchParams.get('active');

    // Build where clause
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (active !== null && active !== undefined) {
      where.active = active === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } },
      ];
    }

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
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Parse JSON fields
    const productsWithParsedData = products.map((product) => ({
      ...product,
      images: JSON.parse(product.images),
      metadata: product.metadata ? JSON.parse(product.metadata) : null,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    }));

    return paginatedResponse(productsWithParsedData, page, limit, total);
  } catch (error) {
    console.error('Get products error:', error);
    return serverErrorResponse('Failed to fetch products');
  }
}

export const POST = requireShopOwner(createProduct);
export const GET = requireShopOwner(getProducts);