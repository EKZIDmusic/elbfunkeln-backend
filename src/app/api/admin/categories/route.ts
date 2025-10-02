import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { requireShopOwner } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
});

/**
 * GET /api/admin/categories
 * Get all categories (Admin/Shop Owner only)
 */
async function getCategories(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
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
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return successResponse(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    return serverErrorResponse('Failed to fetch categories');
  }
}

/**
 * POST /api/admin/categories
 * Create a new category (Admin/Shop Owner only)
 */
async function createCategory(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createCategorySchema.parse(body);

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existingCategory) {
      return errorResponse('Category with this slug already exists', 409);
    }

    // Check if parent exists
    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        return errorResponse('Parent category not found', 404);
      }
    }

    // Create category
    const category = await prisma.category.create({
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
      },
    });

    return successResponse(category, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Create category error:', error);
    return serverErrorResponse('Failed to create category');
  }
}

export const GET = requireShopOwner(getCategories);
export const POST = requireShopOwner(createCategory);