import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SocialService } from './social.service';
import { Public, Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Social')
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Public()
  @Post('share/product')
  @ApiOperation({ summary: 'Share product on social media' })
  @ApiResponse({ status: 200, description: 'Product shared' })
  shareProduct(@Body() shareDto: any) {
    return this.socialService.shareProduct(shareDto);
  }

  @Public()
  @Get('og-data/:id')
  @ApiOperation({ summary: 'Get Open Graph data' })
  @ApiResponse({ status: 200, description: 'OG data retrieved' })
  getOgData(@Param('id') id: string) {
    return this.socialService.getOgData(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('analytics')
  @ApiOperation({ summary: 'Get social media metrics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved' })
  getAnalytics() {
    return this.socialService.getAnalytics();
  }
}
