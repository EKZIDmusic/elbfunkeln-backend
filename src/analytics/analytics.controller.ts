import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto, AnalyticsFilterDto } from './dto/analytics.dto';
import { Public, GetUser, Roles } from '../auth/decorators/auth.decorators';
import { GetIp, GetUserAgent } from '../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Public()
  @Post('track')
  @ApiOperation({ summary: 'Track analytics event' })
  @ApiResponse({ status: 201, description: 'Event tracked successfully' })
  trackEvent(
    @Body() trackEventDto: TrackEventDto,
    @GetUser('id') userId: string | undefined,
    @GetIp() ipAddress: string,
    @GetUserAgent() userAgent: string,
  ) {
    return this.analyticsService.trackEvent(
      trackEventDto,
      userId,
      ipAddress,
      userAgent,
    );
  }
}

@ApiTags('Admin - Analytics')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SHOP_OWNER)
@ApiBearerAuth()
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get analytics dashboard (Admin)' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  getDashboard(@Query() filterDto: AnalyticsFilterDto) {
    return this.analyticsService.getDashboard(filterDto);
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get sales statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Sales stats retrieved' })
  getSalesStats(@Query() filterDto: AnalyticsFilterDto) {
    return this.analyticsService.getSalesStats(filterDto);
  }

  @Get('traffic')
  @ApiOperation({ summary: 'Get traffic statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Traffic stats retrieved' })
  getTrafficStats(@Query() filterDto: AnalyticsFilterDto) {
    return this.analyticsService.getTrafficStats(filterDto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get product performance (Admin)' })
  @ApiResponse({ status: 200, description: 'Product stats retrieved' })
  getProductPerformance() {
    return this.analyticsService.getProductPerformance();
  }
}
