import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  CreateTicketMessageDto,
} from './dto/ticket.dto';
import { TicketStatus } from '@prisma/client';
import { generateTicketNumber } from '../common/utils/helpers';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  // ==================== CUSTOMER ENDPOINTS ====================

  async create(userId: string, createTicketDto: CreateTicketDto) {
    const { subject, message, priority } = createTicketDto;

    const ticketNumber = generateTicketNumber();

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        userId,
        subject,
        priority,
        status: TicketStatus.OPEN,
        messages: {
          create: {
            content: message,
            authorId: userId,
            isInternal: false,
          },
        },
      },
      include: {
        messages: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // TODO: Send notification email to support team

    return ticket;
  }

  async findUserTickets(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId },
      include: {
        messages: {
          where: { isInternal: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        userId,
      },
      include: {
        messages: {
          where: { isInternal: false },
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async addMessage(
    userId: string,
    ticketId: string,
    createMessageDto: CreateTicketMessageDto,
  ) {
    const ticket = await this.findOne(userId, ticketId);

    if (ticket.status === TicketStatus.CLOSED) {
      throw new ForbiddenException('Cannot add message to closed ticket');
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId: userId,
        content: createMessageDto.content,
        isInternal: false,
      },
    });

    // Update ticket status if it was resolved
    if (ticket.status === TicketStatus.RESOLVED) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.OPEN },
      });
    }

    // Update ticket timestamp
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    // TODO: Send notification to support team

    return message;
  }

  async closeTicket(userId: string, ticketId: string) {
    const ticket = await this.findOne(userId, ticketId);

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.CLOSED,
        closedAt: new Date(),
      },
    });
  }

  // ==================== ADMIN ENDPOINTS ====================

  async findAll(status?: TicketStatus) {
    const where = status ? { status } : {};

    return this.prisma.ticket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async findOneAdmin(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async update(ticketId: string, updateTicketDto: UpdateTicketDto) {
    await this.findOneAdmin(ticketId);

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: updateTicketDto,
    });
  }

  async addAdminMessage(
    adminId: string,
    ticketId: string,
    createMessageDto: CreateTicketMessageDto,
  ) {
    await this.findOneAdmin(ticketId);

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId: adminId,
        content: createMessageDto.content,
        isInternal: createMessageDto.isInternal || false,
      },
    });

    // Update ticket timestamp
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    // TODO: Send notification to customer if not internal

    return message;
  }

  async assignTicket(ticketId: string, userId: string) {
    await this.findOneAdmin(ticketId);

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedTo: userId,
        status: TicketStatus.IN_PROGRESS,
      },
    });
  }

  async getStats() {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
    ] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: TicketStatus.OPEN } }),
      this.prisma.ticket.count({
        where: { status: TicketStatus.IN_PROGRESS },
      }),
      this.prisma.ticket.count({ where: { status: TicketStatus.RESOLVED } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.CLOSED } }),
    ]);

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
    };
  }
}
