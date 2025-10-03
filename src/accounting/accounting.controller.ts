import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Accounting')
@Controller('accounting')
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
@UseGuards(JwtAuthGuard, RolesGuard)
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
@Roles('ADMIN')
@ApiBearerAuth()
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('invoice')
  @ApiOperation({ summary: 'Create invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created' })
  createInvoice(@Body() createDto: any) {
    return this.accountingService.createInvoice(createDto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved' })
  getInvoices() {
    return this.accountingService.getInvoices();
  }

  @Post('export/datev')
  @ApiOperation({ summary: 'Export DATEV' })
  @ApiResponse({ status: 200, description: 'DATEV export created' })
  exportDatev() {
    return this.accountingService.exportDatev();
  }

  @Get('tax-report')
  @ApiOperation({ summary: 'Generate tax report' })
  @ApiResponse({ status: 200, description: 'Tax report generated' })
  getTaxReport() {
    return this.accountingService.getTaxReport();
  }
}
