import { NextRequest } from 'next/server';
import { requireAdmin } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { paginatedResponse, serverErrorResponse } from '@/utils/response';
import { Prisma } from '@prisma/client';

/**
 * GET /api/admin/tickets
 * Get all tickets (Admin only)
 */
async function getAllTickets(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    const where: Prisma.TicketWhereInput = {};

    if (status) {
      where.status = status as any;
    }

    if (priority) {
      where.priority = priority as any;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search } },
        {
          user: {
            OR: [
              { email: { contains: search } },
              { firstName: { contains: search } },
              { lastName: { contains: search } },
            ],
          },
        },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
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
        orderBy: [
          { priority: 'desc' },
          { updatedAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return paginatedResponse(tickets, page, limit, total);
  } catch (error) {
    console.error('Get admin tickets error:', error);
    return serverErrorResponse('Failed to fetch tickets');
  }
}

export const GET = requireAdmin(getAllTickets);