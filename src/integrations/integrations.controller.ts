import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('lexoffice')
  @ApiOperation({ summary: 'Sync with Lexoffice' })
  @ApiResponse({ status: 200, description: 'Lexoffice sync completed' })
  syncLexoffice(@Body() syncDto: any) {
    return this.integrationsService.syncLexoffice(syncDto);
  }

  @Post('sevdesk')
  @ApiOperation({ summary: 'Sync with SevDesk' })
  @ApiResponse({ status: 200, description: 'SevDesk sync completed' })
  syncSevDesk(@Body() syncDto: any) {
    return this.integrationsService.syncSevDesk(syncDto);
  }

  @Post('fastbill')
  @ApiOperation({ summary: 'Sync with FastBill' })
  @ApiResponse({ status: 200, description: 'FastBill sync completed' })
  syncFastBill(@Body() syncDto: any) {
    return this.integrationsService.syncFastBill(syncDto);
  }
}
