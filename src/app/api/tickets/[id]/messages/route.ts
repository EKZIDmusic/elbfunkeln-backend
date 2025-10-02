import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { addTicketMessageSchema } from '@/utils/validation';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

/**
 * POST /api/tickets/[id]/messages
 * Add a message to ticket
 */
async function addMessage(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = (req as any).user;
    const { id } = params;
    const body = await req.json();
    const data = addTicketMessageSchema.parse(body);

    // Find ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return notFoundResponse('Ticket not found');
    }

    // Check if ticket belongs to user (or user is admin)
    const isOwner = ticket.userId === user.id;
    const isStaff = user.role === 'ADMIN' || user.role === 'SHOP_OWNER';

    if (!isOwner && !isStaff) {
      return errorResponse('Unauthorized', 403);
    }

    // Check if ticket is closed
    if (ticket.status === 'CLOSED' && isOwner) {
      return errorResponse('Cannot add message to closed ticket', 400);
    }

    // Create message
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        message: data.message,
        isStaff,
      },
    });

    // Update ticket status and updatedAt
    await prisma.ticket.update({
      where: { id },
      data: {
        status: isStaff ? 'IN_PROGRESS' : ticket.status,
        updatedAt: new Date(),
      },
    });

    return successResponse(message, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Add ticket message error:', error);
    return serverErrorResponse('Failed to add message');
  }
}

export const POST = requireAuth(addMessage);