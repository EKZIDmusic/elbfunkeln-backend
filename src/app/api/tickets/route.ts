import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { createTicketSchema } from '@/utils/validation';
import {
  successResponse,
  validationErrorResponse,
  serverErrorResponse,
  paginatedResponse,
} from '@/utils/response';

/**
 * GET /api/tickets
 * Get user's tickets
 */
async function getTickets(req: NextRequest) {
  try {
    const user = (req as any).user;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');

    const where: any = { userId: user.id };
    if (status) {
      where.status = status;
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          messages: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return paginatedResponse(tickets, page, limit, total);
  } catch (error) {
    console.error('Get tickets error:', error);
    return serverErrorResponse('Failed to fetch tickets');
  }
}

/**
 * POST /api/tickets
 * Create a new ticket
 */
async function createTicket(req: NextRequest) {
  try {
    const user = (req as any).user;
    const body = await req.json();
    const data = createTicketSchema.parse(body);

    // Create ticket with first message
    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        subject: data.subject,
        priority: data.priority || 'MEDIUM',
        status: 'OPEN',
        messages: {
          create: {
            message: data.message,
            isStaff: false,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    return successResponse(ticket, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Create ticket error:', error);
    return serverErrorResponse('Failed to create ticket');
  }
}

export const GET = requireAuth(getTickets);
export const POST = requireAuth(createTicket);