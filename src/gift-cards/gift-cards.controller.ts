import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GiftCardsService } from './gift-cards.service';
import {
  PurchaseGiftCardDto,
  CreateGiftCardDto,
  UpdateGiftCardDto,
  ValidateGiftCardDto,
} from './dto/gift-card.dto';
import { Public, GetUser, Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { UserRole } from '@prisma/client';

@ApiTags('Gift Cards')
@Controller('gift-cards')
export class GiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('purchase')
  @ApiOperation({ summary: 'Purchase a gift card' })
  @ApiResponse({ status: 201, description: 'Gift card purchased successfully' })
  purchase(
    @GetUser('id') userId: string,
    @Body() purchaseGiftCardDto: PurchaseGiftCardDto,
  ) {
    return this.giftCardsService.purchase(userId, purchaseGiftCardDto);
  }

  @Public()
  @Post('validate')
  @ApiOperation({ summary: 'Validate gift card code' })
  @ApiResponse({ status: 200, description: 'Gift card is valid' })
  @ApiResponse({ status: 400, description: 'Invalid gift card' })
  @ApiResponse({ status: 404, description: 'Gift card not found' })
  validate(@Body() validateGiftCardDto: ValidateGiftCardDto) {
    return this.giftCardsService.validate(validateGiftCardDto);
  }

  @Public()
  @Get('balance/:code')
  @ApiOperation({ summary: 'Check gift card balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Gift card not found' })
  checkBalance(@Param('code') code: string) {
    return this.giftCardsService.checkBalance(code);
  }
}

@ApiTags('Admin - Gift Cards')
@Controller('admin/gift-cards')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SHOP_OWNER)
@ApiBearerAuth()
export class AdminGiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create gift card (Admin)' })
  @ApiResponse({ status: 201, description: 'Gift card created successfully' })
  create(@Body() createGiftCardDto: CreateGiftCardDto) {
    return this.giftCardsService.create(createGiftCardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all gift cards (Admin)' })
  @ApiResponse({ status: 200, description: 'Gift cards retrieved' })
  findAll() {
    return this.giftCardsService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get gift card statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  getStats() {
    return this.giftCardsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get gift card details (Admin)' })
  @ApiResponse({ status: 200, description: 'Gift card retrieved' })
  @ApiResponse({ status: 404, description: 'Gift card not found' })
  findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.giftCardsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update gift card (Admin)' })
  @ApiResponse({ status: 200, description: 'Gift card updated' })
  @ApiResponse({ status: 404, description: 'Gift card not found' })
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateGiftCardDto: UpdateGiftCardDto,
  ) {
    return this.giftCardsService.update(id, updateGiftCardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate gift card (Admin)' })
  @ApiResponse({ status: 200, description: 'Gift card deactivated' })
  deactivate(@Param('id', ParseUuidPipe) id: string) {
    return this.giftCardsService.deactivate(id);
  }
}
