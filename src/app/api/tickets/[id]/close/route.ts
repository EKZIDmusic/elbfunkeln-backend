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
 * PUT /api/tickets/[id]/close
 * Close a ticket
 */
async function closeTicket(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = (req as any).user;
    const { id } = params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return notFoundResponse('Ticket not found');
    }

    // Check if ticket belongs to user or user is admin
    if (ticket.userId !== user.id && user.role !== 'ADMIN') {
      return errorResponse('Unauthorized', 403);
    }

    if (ticket.status === 'CLOSED') {
      return errorResponse('Ticket is already closed', 400);
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    return successResponse(updatedTicket);
  } catch (error) {
    console.error('Close ticket error:', error);
    return serverErrorResponse('Failed to close ticket');
  }
}

export const PUT = requireAuth(closeTicket);