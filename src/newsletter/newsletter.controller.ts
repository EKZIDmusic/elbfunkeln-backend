import {
  Controller,
  Get,
  Post,
  Body,
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
import { NewsletterService } from './newsletter.service';
import {
  SubscribeNewsletterDto,
  UnsubscribeNewsletterDto,
  CreateCampaignDto,
  SendCampaignDto,
} from './dto/newsletter.dto';
import { Public, Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { UserRole, SubscriptionStatus } from '@prisma/client';

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Public()
  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  @ApiResponse({ status: 201, description: 'Successfully subscribed' })
  @ApiResponse({ status: 409, description: 'Already subscribed' })
  subscribe(@Body() subscribeDto: SubscribeNewsletterDto) {
    return this.newsletterService.subscribe(subscribeDto);
  }

  @Public()
  @Post('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from newsletter' })
  @ApiResponse({ status: 200, description: 'Successfully unsubscribed' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  unsubscribe(@Body() unsubscribeDto: UnsubscribeNewsletterDto) {
    return this.newsletterService.unsubscribe(unsubscribeDto);
  }
}

@ApiTags('Admin - Newsletter')
@Controller('admin/newsletter')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SHOP_OWNER)
@ApiBearerAuth()
export class AdminNewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Get('subscribers')
  @ApiOperation({ summary: 'Get all subscribers (Admin)' })
  @ApiResponse({ status: 200, description: 'Subscribers retrieved' })
  getSubscribers(@Query('status') status?: SubscriptionStatus) {
    return this.newsletterService.getSubscribers(status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get newsletter statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  getStats() {
    return this.newsletterService.getStats();
  }

  @Post('campaigns')
  @ApiOperation({ summary: 'Create newsletter campaign (Admin)' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  createCampaign(@Body() createCampaignDto: CreateCampaignDto) {
    return this.newsletterService.createCampaign(createCampaignDto);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Get all campaigns (Admin)' })
  @ApiResponse({ status: 200, description: 'Campaigns retrieved' })
  getCampaigns() {
    return this.newsletterService.getCampaigns();
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get campaign details (Admin)' })
  @ApiResponse({ status: 200, description: 'Campaign retrieved' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  getCampaign(@Param('id', ParseUuidPipe) id: string) {
    return this.newsletterService.getCampaign(id);
  }

  @Post('campaigns/:id/send')
  @ApiOperation({ summary: 'Send newsletter campaign (Admin)' })
  @ApiResponse({ status: 200, description: 'Campaign sent successfully' })
  @ApiResponse({ status: 409, description: 'Campaign already sent' })
  sendCampaign(@Param('id', ParseUuidPipe) campaignId: string) {
    return this.newsletterService.sendCampaign(campaignId);
  }
}
