import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ==================== PROFILE ====================

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    // Check if email is already taken
    if (updateProfileDto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateProfileDto.email,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    return user;
  }

  async deleteProfile(userId: string) {
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Account successfully deleted' };
  }

  // ==================== ADDRESSES ====================

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async getAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async createAddress(userId: string, createAddressDto: CreateAddressDto) {
    // If this is set as default, unset all other defaults
    if (createAddressDto.isDefault) {
      await this.prisma.address.updateMany({
        where: {
          userId,
          type: createAddressDto.type,
        },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        ...createAddressDto,
        userId,
      },
    });

    return address;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ) {
    // Check if address belongs to user
    await this.getAddress(userId, addressId);

    // If setting as default, unset other defaults
    if (updateAddressDto.isDefault) {
      await this.prisma.address.updateMany({
        where: {
          userId,
          type: updateAddressDto.type,
          NOT: { id: addressId },
        },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: updateAddressDto,
    });

    return address;
  }

  async deleteAddress(userId: string, addressId: string) {
    // Check if address belongs to user
    await this.getAddress(userId, addressId);

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return { message: 'Address successfully deleted' };
  }

  // ==================== FAVORITES ====================

  async getFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: {
              where: { isMain: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((fav) => fav.product);
  }

  async addFavorite(userId: string, productId: string) {
    // Check if already favorited
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Product already in favorites');
    }

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.favorite.create({
      data: {
        userId,
        productId,
      },
    });

    return { message: 'Product added to favorites' };
  }

  async removeFavorite(userId: string, productId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    return { message: 'Product removed from favorites' };
  }

  // ==================== ORDERS ====================

  async getOrderHistory(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isMain: true },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== ADMIN ====================

  async getAllUsers(role?: UserRole, status?: UserStatus) {
    return this.prisma.user.findMany({
      where: {
        ...(role && { role }),
        ...(status && { status }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            orders: true,
            addresses: true,
            favorites: true,
            tickets: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(
    userId: string,
    updateData: {
      role?: UserRole;
      status?: UserStatus;
      emailVerified?: boolean;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });
  }

  async deleteUser(userId: string) {
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User successfully deleted' };
  }

  async banUser(userId: string, reason?: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.BANNED },
    });

    // TODO: Send notification email

    return { message: 'User has been banned' };
  }
}