import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  CreateTicketMessageDto,
} from './dto/ticket.dto';
import { GetUser, Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { UserRole, TicketStatus } from '@prisma/client';

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // ==================== CUSTOMER ENDPOINTS ====================

  @Post()
  @ApiOperation({ summary: 'Create support ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  create(
    @GetUser('id') userId: string,
    @Body() createTicketDto: CreateTicketDto,
  ) {
    return this.ticketsService.create(userId, createTicketDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user tickets' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  findUserTickets(@GetUser('id') userId: string) {
    return this.ticketsService.findUserTickets(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket details' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  findOne(
    @GetUser('id') userId: string,
    @Param('id', ParseUuidPipe) ticketId: string,
  ) {
    return this.ticketsService.findOne(userId, ticketId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add message to ticket' })
  @ApiResponse({ status: 201, description: 'Message added successfully' })
  @ApiResponse({ status: 403, description: 'Cannot add to closed ticket' })
  addMessage(
    @GetUser('id') userId: string,
    @Param('id', ParseUuidPipe) ticketId: string,
    @Body() createMessageDto: CreateTicketMessageDto,
  ) {
    return this.ticketsService.addMessage(userId, ticketId, createMessageDto);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close ticket' })
  @ApiResponse({ status: 200, description: 'Ticket closed successfully' })
  closeTicket(
    @GetUser('id') userId: string,
    @Param('id', ParseUuidPipe) ticketId: string,
  ) {
    return this.ticketsService.closeTicket(userId, ticketId);
  }
}

@ApiTags('Admin - Tickets')
@Controller('admin/tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SHOP_OWNER)
@ApiBearerAuth()
export class AdminTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tickets (Admin)' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  findAll(@Query('status') status?: TicketStatus) {
    return this.ticketsService.findAll(status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ticket statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  getStats() {
    return this.ticketsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket details (Admin)' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  findOne(@Param('id', ParseUuidPipe) ticketId: string) {
    return this.ticketsService.findOneAdmin(ticketId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket (Admin)' })
  @ApiResponse({ status: 200, description: 'Ticket updated successfully' })
  update(
    @Param('id', ParseUuidPipe) ticketId: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(ticketId, updateTicketDto);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add admin message to ticket (Admin)' })
  @ApiResponse({ status: 201, description: 'Message added successfully' })
  addAdminMessage(
    @GetUser('id') adminId: string,
    @Param('id', ParseUuidPipe) ticketId: string,
    @Body() createMessageDto: CreateTicketMessageDto,
  ) {
    return this.ticketsService.addAdminMessage(
      adminId,
      ticketId,
      createMessageDto,
    );
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign ticket to user (Admin)' })
  @ApiResponse({ status: 200, description: 'Ticket assigned successfully' })
  assignTicket(
    @Param('id', ParseUuidPipe) ticketId: string,
    @Body('userId') userId: string,
  ) {
    return this.ticketsService.assignTicket(ticketId, userId);
  }
}