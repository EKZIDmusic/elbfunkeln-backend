# ============================================================
# PowerShell Script: Fix Missing Files (Simplified & Reliable)
# ============================================================

Write-Host "===========================================================" -ForegroundColor Yellow
Write-Host "Creating Missing Files for Elbfunkeln Backend" -ForegroundColor Yellow
Write-Host "===========================================================" -ForegroundColor Yellow
Write-Host ""

$ErrorActionPreference = "Stop"

# Helper function to create file with LF endings
function Create-File {
    param(
        [string]$Path,
        [string]$Content
    )
    
    # Ensure directory exists
    $dir = Split-Path -Parent $Path
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    
    # Convert CRLF to LF
    $Content = $Content -replace "`r`n", "`n"
    
    # Write with UTF-8 without BOM
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
    
    Write-Host "  ✓ Created: $Path" -ForegroundColor Green
}

Write-Host "1. Creating Orders DTOs..." -ForegroundColor Cyan
Write-Host ""

# ============================================================
# orders/dto/order.dto.ts
# ============================================================
Create-File -Path "src\orders\dto\order.dto.ts" -Content @"
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  shippingAddressId: string;

  @ApiProperty()
  @IsString()
  billingAddressId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerNote?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  discountCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shippingMethod?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
  })
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  internalNote?: string;
}

export class UpdateTrackingDto {
  @ApiProperty()
  @IsString()
  trackingNumber: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  trackingUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shippingMethod?: string;
}
"@

# ============================================================
# orders/dto/order-filter.dto.ts
# ============================================================
Create-File -Path "src\orders\dto\order-filter.dto.ts" -Content @"
import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class OrderFilterDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
"@

Write-Host ""
Write-Host "2. Creating Auth Decorators..." -ForegroundColor Cyan
Write-Host ""

# ============================================================
# auth/decorators/auth.decorators.ts
# ============================================================
Create-File -Path "src\auth\decorators\auth.decorators.ts" -Content @"
import { SetMetadata } from '@nestjs/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
"@

Write-Host ""
Write-Host "3. Creating Auth Guards..." -ForegroundColor Cyan
Write-Host ""

# ============================================================
# auth/guards/jwt-auth.guard.ts
# ============================================================
Create-File -Path "src\auth\guards\jwt-auth.guard.ts" -Content @"
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
"@

# ============================================================
# auth/guards/roles.guard.ts
# ============================================================
Create-File -Path "src\auth\guards\roles.guard.ts" -Content @"
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/auth.decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user?.role === role);
  }
}
"@

Write-Host ""
Write-Host "4. Creating Common Pipes..." -ForegroundColor Cyan
Write-Host ""

# ============================================================
# common/pipes/parse-uuid.pipe.ts
# ============================================================
Create-File -Path "src\common\pipes\parse-uuid.pipe.ts" -Content @"
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUUID(value)) {
      throw new BadRequestException('Invalid UUID format');
    }
    return value;
  }
}
"@

Write-Host ""
Write-Host "5. Creating Additional DTOs..." -ForegroundColor Cyan
Write-Host ""

# ============================================================
# users/dto/create-user.dto.ts
# ============================================================
Create-File -Path "src\users\dto\create-user.dto.ts" -Content @"
import { IsString, IsEmail, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: ['CUSTOMER', 'SHOP_OWNER', 'ADMIN'] })
  @IsEnum(['CUSTOMER', 'SHOP_OWNER', 'ADMIN'])
  @IsOptional()
  role?: string;
}
"@

# ============================================================
# users/dto/update-user.dto.ts
# ============================================================
Create-File -Path "src\users\dto\update-user.dto.ts" -Content @"
import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
"@

# ============================================================
# users/dto/update-profile.dto.ts
# ============================================================
Create-File -Path "src\users\dto\update-profile.dto.ts" -Content @"
import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;
}
"@

# ============================================================
# users/dto/address.dto.ts
# ============================================================
Create-File -Path "src\users\dto\address.dto.ts" -Content @"
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty()
  @IsString()
  street: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  zipCode: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  apartment?: string;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
"@

# ============================================================
# users/dto/favorite.dto.ts
# ============================================================
Create-File -Path "src\users\dto\favorite.dto.ts" -Content @"
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddFavoriteDto {
  @ApiProperty()
  @IsString()
  productId: string;
}

export class RemoveFavoriteDto {
  @ApiProperty()
  @IsString()
  productId: string;
}
"@

# ============================================================
# cart/dto/cart.dto.ts
# ============================================================
Create-File -Path "src\cart\dto\cart.dto.ts" -Content @"
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class ApplyDiscountDto {
  @ApiProperty()
  @IsString()
  code: string;
}

export class CartSummaryDto {
  items: CartItemSummaryDto[];
  totalItems: number;
  totalProducts: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  discount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CartItemSummaryDto {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  stock: number;
  isAvailable: boolean;
}
"@

# ============================================================
# reviews/dto/review.dto.ts
# ============================================================
Create-File -Path "src\reviews\dto\review.dto.ts" -Content @"
import { IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;
}

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}
"@

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Yellow
Write-Host "SUCCESS! All files created" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Created Files:" -ForegroundColor Cyan
Write-Host "  ✓ src\orders\dto\order.dto.ts" -ForegroundColor White
Write-Host "  ✓ src\orders\dto\order-filter.dto.ts" -ForegroundColor White
Write-Host "  ✓ src\auth\decorators\auth.decorators.ts" -ForegroundColor White
Write-Host "  ✓ src\auth\guards\jwt-auth.guard.ts" -ForegroundColor White
Write-Host "  ✓ src\auth\guards\roles.guard.ts" -ForegroundColor White
Write-Host "  ✓ src\common\pipes\parse-uuid.pipe.ts" -ForegroundColor White
Write-Host "  ✓ src\users\dto\create-user.dto.ts" -ForegroundColor White
Write-Host "  ✓ src\users\dto\update-user.dto.ts" -ForegroundColor White
Write-Host "  ✓ src\users\dto\update-profile.dto.ts" -ForegroundColor White
Write-Host "  ✓ src\users\dto\address.dto.ts" -ForegroundColor White
Write-Host "  ✓ src\users\dto\favorite.dto.ts" -ForegroundColor White
Write-Host "  ✓ src\cart\dto\cart.dto.ts" -ForegroundColor White
Write-Host "  ✓ src\reviews\dto\review.dto.ts" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Install dependencies:" -ForegroundColor White
Write-Host "   npm install uuid @nestjs/passport passport passport-jwt" -ForegroundColor Gray
Write-Host "   npm install --save-dev @types/uuid @types/passport-jwt" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Check if VS Code recognizes the files (reload window if needed)" -ForegroundColor White
Write-Host "   Press: Ctrl+Shift+P -> 'Developer: Reload Window'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Try building the project:" -ForegroundColor White
Write-Host "   npm run build" -ForegroundColor Gray
Write-Host ""
Write-Host "If errors persist, send me the new error messages!" -ForegroundColor Cyan
Write-Host ""