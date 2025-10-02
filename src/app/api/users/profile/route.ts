import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { updateProfileSchema } from '@/utils/validation';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

/**
 * GET /api/users/profile
 * Get current user profile
 */
async function getProfile(req: NextRequest) {
  try {
    const user = (req as any).user;

    // Fetch complete user profile
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            street: true,
            zip: true,
            city: true,
            country: true,
            phone: true,
            isDefault: true,
          },
        },
      },
    });

    if (!profile) {
      return errorResponse('Profile not found', 404);
    }

    return successResponse(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    return serverErrorResponse('Failed to fetch profile');
  }
}

/**
 * PUT /api/users/profile
 * Update current user profile
 */
async function updateProfile(req: NextRequest) {
  try {
    const user = (req as any).user;
    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return errorResponse('Email already in use', 409);
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        updatedAt: true,
      },
    });

    return successResponse(updatedUser);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Update profile error:', error);
    return serverErrorResponse('Failed to update profile');
  }
}

/**
 * DELETE /api/users/profile
 * Delete current user account
 */
async function deleteProfile(req: NextRequest) {
  try {
    const user = (req as any).user;

    // Delete user and all related data (cascading deletes via Prisma schema)
    await prisma.user.delete({
      where: { id: user.id },
    });

    return successResponse({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    return serverErrorResponse('Failed to delete account');
  }
}

// Export wrapped handlers with auth middleware
export const GET = requireAuth(getProfile);
export const PUT = requireAuth(updateProfile);
export const DELETE = requireAuth(deleteProfile);