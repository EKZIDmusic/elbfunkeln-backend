import { Controller, Get, Put, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CookiesService } from './cookies.service';
import { Public } from '../auth/decorators/auth.decorators';

@ApiTags('Cookies')
@Controller('cookies')
@Public()
export class CookiesController {
  constructor(private readonly cookiesService: CookiesService) {}

  @Get('preferences')
  @ApiOperation({ summary: 'Get cookie preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved' })
  getPreferences() {
    return this.cookiesService.getPreferences();
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update cookie preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  updatePreferences(@Body() preferences: any) {
    return this.cookiesService.updatePreferences(preferences);
  }

  @Post('consent')
  @ApiOperation({ summary: 'Save cookie consent' })
  @ApiResponse({ status: 201, description: 'Consent saved' })
  saveConsent(@Body() consent: any) {
    return this.cookiesService.saveConsent(consent);
  }
}
