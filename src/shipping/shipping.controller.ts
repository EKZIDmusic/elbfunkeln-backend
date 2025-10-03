import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { CalculateShippingDto, ValidateAddressDto } from './dto/shipping.dto';
import { Public, Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Public()
  @Get('options')
  @ApiOperation({ summary: 'Get shipping options' })
  @ApiResponse({ status: 200, description: 'Shipping options retrieved' })
  getOptions() {
    return this.shippingService.getShippingOptions();
  }

  @Public()
  @Post('calculate')
  @ApiOperation({ summary: 'Calculate shipping costs' })
  @ApiResponse({ status: 200, description: 'Shipping cost calculated' })
  calculate(@Body() calculateDto: CalculateShippingDto) {
    return this.shippingService.calculateShipping(calculateDto);
  }

  @Public()
  @Get('zones')
  @ApiOperation({ summary: 'Get shipping zones' })
  @ApiResponse({ status: 200, description: 'Shipping zones retrieved' })
  getZones() {
    return this.shippingService.getShippingZones();
  }

  @Public()
  @Post('validate-address')
  @ApiOperation({ summary: 'Validate address' })
  @ApiResponse({ status: 200, description: 'Address validated' })
  validateAddress(@Body() validateDto: ValidateAddressDto) {
    return this.shippingService.validateAddress(validateDto);
  }
}

@ApiTags('Admin - Shipping')
@Controller('admin/shipping')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SHOP_OWNER)
@ApiBearerAuth()
export class AdminShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('dhl/label')
  @ApiOperation({ summary: 'Create DHL shipping label' })
  @ApiResponse({ status: 201, description: 'Label created successfully' })
  createLabel(@Body() labelDto: any) {
    return this.shippingService.createDhlLabel(labelDto);
  }

  @Get('dhl/track/:trackingNumber')
  @ApiOperation({ summary: 'Track DHL shipment' })
  @ApiResponse({ status: 200, description: 'Tracking info retrieved' })
  trackShipment(@Param('trackingNumber') trackingNumber: string) {
    return this.shippingService.trackShipment(trackingNumber);
  }
}
