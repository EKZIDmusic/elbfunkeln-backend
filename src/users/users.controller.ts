import {
  Controller,
  Get,
  Put,
  Delete,
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
import { UsersService } from './users.service';
import { GetUser, Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { UserRole, UserStatus } from '@prisma/client';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==================== PROFILE ====================

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@GetUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @GetUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Delete('profile')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  async deleteProfile(@GetUser('id') userId: string) {
    return this.usersService.deleteProfile(userId);
  }

  // ==================== ADDRESSES ====================

  @Get('addresses')
  @ApiOperation({ summary: 'Get all user addresses' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  async getAddresses(@GetUser('id') userId: string) {
    return this.usersService.getAddresses(userId);
  }

  @Get('addresses/:id')
  @ApiOperation({ summary: 'Get specific address' })
  @ApiResponse({ status: 200, description: 'Address retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async getAddress(
    @GetUser('id') userId: string,
    @Param('id', ParseUuidPipe) addressId: string,
  ) {
    return this.usersService.getAddress(userId, addressId);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Create new address' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  async createAddress(
    @GetUser('id') userId: string,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.usersService.createAddress(userId, createAddressDto);
  }

  @Put('addresses/:id')
  @ApiOperation({ summary: 'Update address' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateAddress(
    @GetUser('id') userId: string,
    @Param('id', ParseUuidPipe) addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(userId, addressId, updateAddressDto);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete address' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async deleteAddress(
    @GetUser('id') userId: string,
    @Param('id', ParseUuidPipe) addressId: string,
  ) {
    return this.usersService.deleteAddress(userId, addressId);
  }

  // ==================== FAVORITES ====================

  @Get('favorites')
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiResponse({ status: 200, description: 'Favorites retrieved successfully' })
  async getFavorites(@GetUser('id') userId: string) {
    return this.usersService.getFavorites(userId);
  }

  @Post('favorites/:productId')
  @ApiOperation({ summary: 'Add product to favorites' })
  @ApiResponse({ status: 201, description: 'Added to favorites' })
  @ApiResponse({ status: 409, description: 'Already in favorites' })
  async addFavorite(
    @GetUser('id') userId: string,
    @Param('productId', ParseUuidPipe) productId: string,
  ) {
    return this.usersService.addFavorite(userId, productId);
  }

  @Delete('favorites/:productId')
  @ApiOperation({ summary: 'Remove product from favorites' })
  @ApiResponse({ status: 200, description: 'Removed from favorites' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  async removeFavorite(
    @GetUser('id') userId: string,
    @Param('productId', ParseUuidPipe) productId: string,
  ) {
    return this.usersService.removeFavorite(userId, productId);
  }

  // ==================== ORDERS ====================

  @Get('orders')
  @ApiOperation({ summary: 'Get user order history' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getOrderHistory(@GetUser('id') userId: string) {
    return this.usersService.getOrderHistory(userId);
  }
}

@ApiTags('Admin - Users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (Admin)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
  ) {
    return this.usersService.getAllUsers(role, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Admin)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id', ParseUuidPipe) userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user (Admin)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(
    @Param('id', ParseUuidPipe) userId: string,
    @Body()
    updateData: {
      role?: UserRole;
      status?: UserStatus;
      emailVerified?: boolean;
    },
  ) {
    return this.usersService.updateUser(userId, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (Admin)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('id', ParseUuidPipe) userId: string) {
    return this.usersService.deleteUser(userId);
  }

  @Post(':id/ban')
  @ApiOperation({ summary: 'Ban user (Admin)' })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  async banUser(
    @Param('id', ParseUuidPipe) userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.usersService.banUser(userId, reason);
  }
}