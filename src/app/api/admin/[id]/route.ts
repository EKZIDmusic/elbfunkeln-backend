import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireShopOwner } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { updateProductSchema } from '@/utils/validation';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

/**
 * GET /api/admin/products/[id]
 * Get single product (Admin/Shop Owner only)
 */
async function getProduct(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            verified: true,
            createdAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!product) {
      return notFoundResponse('Product not found');
    }

    // Parse JSON fields
    const productWithParsedData = {
      ...product,
      images: JSON.parse(product.images),
      metadata: product.metadata ? JSON.parse(product.metadata) : null,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    };

    return successResponse(productWithParsedData);
  } catch (error) {
    console.error('Get product error:', error);
    return serverErrorResponse('Failed to fetch product');
  }
}

/**
 * PUT /api/admin/products/[id]
 * Update a product (Admin/Shop Owner only)
 */
async function updateProduct(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const data = updateProductSchema.parse(body);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return notFoundResponse('Product not found');
    }

    // Check if slug is being changed and already exists
    if (data.slug && data.slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return errorResponse('Product with this slug already exists', 409);
      }
    }

    // Check if SKU is being changed and already exists
    if (data.sku && data.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (skuExists) {
        return errorResponse('Product with this SKU already exists', 409);
      }
    }

    // Check if category exists if being changed
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        return errorResponse('Category not found', 404);
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.comparePrice !== undefined) updateData.comparePrice = data.comparePrice;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata ? JSON.stringify(data.metadata) : null;
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
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

    return successResponse(productWithParsedData);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Update product error:', error);
    return serverErrorResponse('Failed to update product');
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Delete a product (Admin/Shop Owner only)
 */
async function deleteProduct(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return notFoundResponse('Product not found');
    }

    // Check if product is in any active orders
    const ordersWithProduct = await prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          status: {
            in: ['PENDING', 'PROCESSING', 'SHIPPED'],
          },
        },
      },
    });

    if (ordersWithProduct > 0) {
      return errorResponse(
        'Cannot delete product with active orders. Please deactivate instead.',
        400
      );
    }

    // Soft delete by deactivating instead of hard delete
    await prisma.product.update({
      where: { id },
      data: { active: false },
    });

    return successResponse({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return serverErrorResponse('Failed to delete product');
  }
}

export const GET = requireShopOwner(getProduct);
export const PUT = requireShopOwner(updateProduct);
export const DELETE = requireShopOwner(deleteProduct);