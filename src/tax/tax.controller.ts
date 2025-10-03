import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TaxService } from './tax.service';
import { Public } from '../auth/decorators/auth.decorators';

@ApiTags('Tax')
@Controller('tax')
@Public()
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get('rates')
  @ApiOperation({ summary: 'Get German VAT rates' })
  @ApiResponse({ status: 200, description: 'Tax rates retrieved' })
  getRates() {
    return this.taxService.getTaxRates();
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate tax' })
  @ApiResponse({ status: 200, description: 'Tax calculated' })
  calculate(@Body() calculateDto: any) {
    return this.taxService.calculateTax(calculateDto);
  }

  @Get('invoice/:id')
  @ApiOperation({ summary: 'Generate invoice' })
  @ApiResponse({ status: 200, description: 'Invoice generated' })
  generateInvoice(@Param('id') id: string) {
    return this.taxService.generateInvoice(id);
  }
}
