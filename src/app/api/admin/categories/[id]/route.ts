import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { requireShopOwner } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().uuid().optional().nullable(),
});

/**
 * PUT /api/admin/categories/[id]
 * Update a category (Admin/Shop Owner only)
 */
async function updateCategory(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const data = updateCategorySchema.parse(body);

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return notFoundResponse('Category not found');
    }

    // Check if slug is being changed and already exists
    if (data.slug && data.slug !== existingCategory.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return errorResponse('Category with this slug already exists', 409);
      }
    }

    // Check if parent exists
    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        return errorResponse('Parent category not found', 404);
      }

      // Check for circular reference
      if (data.parentId === id) {
        return errorResponse('Category cannot be its own parent', 400);
      }
    }

    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        parentId: data.parentId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return successResponse(category);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Update category error:', error);
    return serverErrorResponse('Failed to update category');
  }
}

/**
 * DELETE /api/admin/categories/[id]
 * Delete a category (Admin/Shop Owner only)
 */
async function deleteCategory(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
          },
        },
        children: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!category) {
      return notFoundResponse('Category not found');
    }

    // Check if category has products
    if (category.products.length > 0) {
      return errorResponse(
        'Cannot delete category with products. Please move or delete products first.',
        400
      );
    }

    // Check if category has children
    if (category.children.length > 0) {
      return errorResponse(
        'Cannot delete category with subcategories. Please delete subcategories first.',
        400
      );
    }

    // Delete category
    await prisma.category.delete({
      where: { id },
    });

    return successResponse({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    return serverErrorResponse('Failed to delete category');
  }
}

export const PUT = requireShopOwner(updateCategory);
export const DELETE = requireShopOwner(deleteCategory);