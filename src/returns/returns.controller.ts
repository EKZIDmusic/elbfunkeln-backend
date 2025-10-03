import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReturnsService } from './returns.service';
import { CreateReturnDto, UpdateReturnDto } from './dto/return.dto';
import { GetUser, Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { UserRole } from '@prisma/client';

@ApiTags('Returns')
@Controller('returns')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post('request')
  @ApiOperation({ summary: 'Request a return' })
  @ApiResponse({ status: 201, description: 'Return requested successfully' })
  request(@GetUser('id') userId: string, @Body() createDto: CreateReturnDto) {
    return this.returnsService.createReturn(userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my returns' })
  @ApiResponse({ status: 200, description: 'Returns retrieved' })
  getMyReturns(@GetUser('id') userId: string) {
    return this.returnsService.getUserReturns(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get return details' })
  @ApiResponse({ status: 200, description: 'Return retrieved' })
  getOne(
    @GetUser('id') userId: string,
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.returnsService.getReturn(userId, id);
  }
}

@ApiTags('Admin - Returns')
@Controller('admin/returns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SHOP_OWNER)
@ApiBearerAuth()
export class AdminReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all returns (Admin)' })
  @ApiResponse({ status: 200, description: 'Returns retrieved' })
  getAll() {
    return this.returnsService.getAllReturns();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update return status (Admin)' })
  @ApiResponse({ status: 200, description: 'Return updated' })
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateDto: UpdateReturnDto,
  ) {
    return this.returnsService.updateReturn(id, updateDto);
  }
}
