import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SHOP_OWNER)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('executive')
  @ApiOperation({ summary: 'Get executive dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  getExecutiveDashboard() {
    return this.dashboardService.getExecutiveDashboard();
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get sales dashboard' })
  @ApiResponse({ status: 200, description: 'Sales dashboard retrieved' })
  getSalesDashboard() {
    return this.dashboardService.getSalesDashboard();
  }

  @Get('operations')
  @ApiOperation({ summary: 'Get operations dashboard' })
  @ApiResponse({ status: 200, description: 'Operations dashboard retrieved' })
  getOperationsDashboard() {
    return this.dashboardService.getOperationsDashboard();
  }
}
