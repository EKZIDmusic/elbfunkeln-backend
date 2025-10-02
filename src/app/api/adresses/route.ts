import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { addressSchema } from '@/utils/validation';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

/**
 * GET /api/addresses/[id]
 * Get single address
 */
async function getAddress(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = (req as any).user;
    const { id } = params;

    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      return notFoundResponse('Address not found');
    }

    // Check if address belongs to user
    if (address.userId !== user.id) {
      return errorResponse('Unauthorized', 403);
    }

    return successResponse(address);
  } catch (error) {
    console.error('Get address error:', error);
    return serverErrorResponse('Failed to fetch address');
  }
}

/**
 * PUT /api/addresses/[id]
 * Update an address
 */
async function updateAddress(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = (req as any).user;
    const { id } = params;
    const body = await req.json();
    const data = addressSchema.parse(body);

    // Find address
    const existingAddress = await prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      return notFoundResponse('Address not found');
    }

    // Check if address belongs to user
    if (existingAddress.userId !== user.id) {
      return errorResponse('Unauthorized', 403);
    }

    // If setting as default, unset other default addresses
    if (data.isDefault && !existingAddress.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update address
    const address = await prisma.address.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        street: data.street,
        zip: data.zip,
        city: data.city,
        country: data.country || 'DE',
        phone: data.phone,
        isDefault: data.isDefault,
      },
    });

    return successResponse(address);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Update address error:', error);
    return serverErrorResponse('Failed to update address');
  }
}

/**
 * DELETE /api/addresses/[id]
 * Delete an address
 */
async function deleteAddress(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = (req as any).user;
    const { id } = params;

    // Find address
    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      return notFoundResponse('Address not found');
    }

    // Check if address belongs to user
    if (address.userId !== user.id) {
      return errorResponse('Unauthorized', 403);
    }

    // Check if address is used in any pending orders
    const ordersWithAddress = await prisma.order.count({
      where: {
        OR: [
          { shippingAddressId: id },
          { billingAddressId: id },
        ],
        status: {
          in: ['PENDING', 'PROCESSING', 'SHIPPED'],
        },
      },
    });

    if (ordersWithAddress > 0) {
      return errorResponse(
        'Cannot delete address used in active orders',
        400
      );
    }

    // Delete address
    await prisma.address.delete({
      where: { id },
    });

    // If deleted address was default, make another one default
    if (address.isDefault) {
      const firstAddress = await prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      });

      if (firstAddress) {
        await prisma.address.update({
          where: { id: firstAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return successResponse({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    return serverErrorResponse('Failed to delete address');
  }
}

export const GET = requireAuth(getAddress);
export const PUT = requireAuth(updateAddress);
export const DELETE = requireAuth(deleteAddress);