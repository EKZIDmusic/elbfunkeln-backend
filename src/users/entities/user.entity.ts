import { User, UserRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class UserEntity implements User {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @Exclude()
  password: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  phone: string | null;

  @ApiPropertyOptional()
  dateOfBirth: Date | null;

  @ApiPropertyOptional()
  bio: string | null;

  @ApiPropertyOptional()
  avatarUrl: string | null;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  isEmailVerified: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  lastLoginAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  // Computed properties
  @ApiProperty()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}