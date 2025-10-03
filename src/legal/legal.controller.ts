import { Controller, Get, Delete, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LegalService } from './legal.service';
import { Public, GetUser } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Public()
  @Get('terms')
  @ApiOperation({ summary: 'Get terms and conditions' })
  @ApiResponse({ status: 200, description: 'Terms retrieved' })
  getTerms() {
    return this.legalService.getTerms();
  }

  @Public()
  @Get('privacy')
  @ApiOperation({ summary: 'Get privacy policy' })
  @ApiResponse({ status: 200, description: 'Privacy policy retrieved' })
  getPrivacy() {
    return this.legalService.getPrivacy();
  }

  @Public()
  @Get('imprint')
  @ApiOperation({ summary: 'Get imprint' })
  @ApiResponse({ status: 200, description: 'Imprint retrieved' })
  getImprint() {
    return this.legalService.getImprint();
  }

  @Public()
  @Get('withdrawal')
  @ApiOperation({ summary: 'Get withdrawal right' })
  @ApiResponse({ status: 200, description: 'Withdrawal right retrieved' })
  getWithdrawal() {
    return this.legalService.getWithdrawal();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('gdpr-export')
  @ApiOperation({ summary: 'Export user data (GDPR)' })
  @ApiResponse({ status: 200, description: 'Data exported' })
  exportData(@GetUser('id') userId: string) {
    return this.legalService.exportUserData(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('gdpr-deletion')
  @ApiOperation({ summary: 'Request data deletion (GDPR)' })
  @ApiResponse({ status: 200, description: 'Deletion requested' })
  requestDeletion(@GetUser('id') userId: string) {
    return this.legalService.requestDataDeletion(userId);
  }
}
