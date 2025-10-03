import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { KpisService } from './kpis.service';
import { Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('KPIs')
@Controller('kpis')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SHOP_OWNER)
@ApiBearerAuth()
export class KpisController {
  constructor(private readonly kpisService: KpisService) {}

  @Get('sales/revenue')
  @ApiOperation({ summary: 'Get revenue KPIs' })
  @ApiResponse({ status: 200, description: 'Revenue KPIs retrieved' })
  getRevenueKpis() {
    return this.kpisService.getRevenueKpis();
  }

  @Get('sales/conversion')
  @ApiOperation({ summary: 'Get conversion rate' })
  @ApiResponse({ status: 200, description: 'Conversion rate retrieved' })
  getConversionRate() {
    return this.kpisService.getConversionRate();
  }

  @Get('sales/avg-order')
  @ApiOperation({ summary: 'Get average order value' })
  @ApiResponse({ status: 200, description: 'Average order value retrieved' })
  getAvgOrderValue() {
    return this.kpisService.getAvgOrderValue();
  }

  @Get('marketing/traffic')
  @ApiOperation({ summary: 'Get traffic analysis' })
  @ApiResponse({ status: 200, description: 'Traffic analysis retrieved' })
  getTrafficAnalysis() {
    return this.kpisService.getTrafficAnalysis();
  }

  @Get('operations/inventory')
  @ApiOperation({ summary: 'Get inventory KPIs' })
  @ApiResponse({ status: 200, description: 'Inventory KPIs retrieved' })
  getInventoryKpis() {
    return this.kpisService.getInventoryKpis();
  }
}
