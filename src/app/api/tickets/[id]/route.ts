import { NextRequest } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/utils/response';

/**
 * GET /api/tickets/[id]
 * Get ticket details
 */
async function getTicket(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = (req as any).user;
    const { id } = params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!ticket) {
      return notFoundResponse('Ticket not found');
    }

    // Check if ticket belongs to user (or user is admin)
    if (ticket.userId !== user.id && user.role !== 'ADMIN') {
      return errorResponse('Unauthorized', 403);
    }

    return successResponse(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    return serverErrorResponse('Failed to fetch ticket');
  }
}

export const GET = requireAuth(getTicket);