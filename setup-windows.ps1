# PowerShell Script für Windows
# Führe dies in PowerShell aus: .\setup-windows.ps1

Write-Host "🚀 Erstelle Elbfunkeln Module..." -ForegroundColor Green

# Erstelle Ordner
Write-Host "📁 Erstelle Ordner..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "src/products/dto" | Out-Null
New-Item -ItemType Directory -Force -Path "src/categories/dto" | Out-Null
New-Item -ItemType Directory -Force -Path "src/gift-cards/dto" | Out-Null
New-Item -ItemType Directory -Force -Path "src/tickets/dto" | Out-Null
New-Item -ItemType Directory -Force -Path "src/newsletter/dto" | Out-Null
New-Item -ItemType Directory -Force -Path "src/reviews/dto" | Out-Null
New-Item -ItemType Directory -Force -Path "src/search/dto" | Out-Null
New-Item -ItemType Directory -Force -Path "src/shipping/dto" | Out-Null
New-Item -ItemType Directory -Force -Path "src/cookies/dto" | Out-Null
New-Item -ItemType Directory -Force -Path "src/gdpr/dto" | Out-Null
New-Item -ItemType Directory -Force -Path "src/tax/dto" | Out-Null
New-Item -ItemType Directory -Force -Path "src/legal" | Out-Null

Write-Host "✅ Ordner erstellt!" -ForegroundColor Green

# PRODUCTS MODULE
Write-Host "📦 Erstelle Products Module..." -ForegroundColor Yellow

@"
import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsNumber() @Min(0) price: number;
  @ApiPropertyOptional() @IsString() @IsOptional() sku?: string;
  @ApiProperty() @IsString() categoryId: string;
  @ApiProperty() @IsNumber() @Min(0) stock: number;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isFeatured?: boolean;
}
"@ | Out-File -FilePath "src/products/dto/create-product.dto.ts" -Encoding utf8

@"
import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
export class UpdateProductDto extends PartialType(CreateProductDto) {}
"@ | Out-File -FilePath "src/products/dto/update-product.dto.ts" -Encoding utf8

@"
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FilterProductsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1) limit?: number;
}
"@ | Out-File -FilePath "src/products/dto/filter-products.dto.ts" -Encoding utf8

@"
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductsDto } from './dto/filter-products.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: { ...dto, slug: this.generateSlug(dto.name) },
      include: { category: true, images: true },
    });
  }

  async findAll(filterDto: FilterProductsDto) {
    const { page = 1, limit = 10, search, categoryId, minPrice, maxPrice } = filterDto;
    const where: any = { isActive: true };
    if (search) where.OR = [{ name: { contains: search }}, { description: { contains: search }}];
    if (categoryId) where.categoryId = categoryId;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where, include: { category: true, images: true },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: products, meta: { total, page, limit, totalPages: Math.ceil(total / limit) }};
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id }, include: { category: true, images: true },
    });
    if (!product) throw new NotFoundException('Produkt nicht gefunden');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id }});
  }

  private generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-${'$'}/g, '');
  }
}
"@ | Out-File -FilePath "src/products/products.service.ts" -Encoding utf8

@"
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  @Get() @Public() findAll(@Query() dto: FilterProductsDto) { return this.productsService.findAll(dto); }
  @Get(':id') @Public() findOne(@Param('id') id: string) { return this.productsService.findOne(id); }
}

@ApiTags('admin/products')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SHOP_OWNER)
@ApiBearerAuth()
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}
  @Post() create(@Body() dto: CreateProductDto) { return this.productsService.create(dto); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: UpdateProductDto) { return this.productsService.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.productsService.remove(id); }
}
"@ | Out-File -FilePath "src/products/products.controller.ts" -Encoding utf8

@"
import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController, AdminProductsController } from './products.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
"@ | Out-File -FilePath "src/products/products.module.ts" -Encoding utf8

# CATEGORIES MODULE
Write-Host "📂 Erstelle Categories Module..." -ForegroundColor Yellow

@"
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() parentId?: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() sortOrder?: number;
}
"@ | Out-File -FilePath "src/categories/dto/create-category.dto.ts" -Encoding utf8

@"
import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
"@ | Out-File -FilePath "src/categories/dto/update-category.dto.ts" -Encoding utf8

@"
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    return this.prisma.category.create({ 
      data: { ...dto, slug: dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      include: { parent: true, children: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id }});
    if (!category) throw new NotFoundException('Kategorie nicht gefunden');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.category.delete({ where: { id }});
  }
}
"@ | Out-File -FilePath "src/categories/categories.service.ts" -Encoding utf8

@"
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}
  @Get() @Public() findAll() { return this.service.findAll(); }
  @Get(':id') @Public() findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) @ApiBearerAuth() create(@Body() dto: CreateCategoryDto) { return this.service.create(dto); }
  @Put(':id') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) @ApiBearerAuth() update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) { return this.service.update(id, dto); }
  @Delete(':id') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) @ApiBearerAuth() remove(@Param('id') id: string) { return this.service.remove(id); }
}
"@ | Out-File -FilePath "src/categories/categories.controller.ts" -Encoding utf8

@"
import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
"@ | Out-File -FilePath "src/categories/categories.module.ts" -Encoding utf8

# GIFT CARDS MODULE
Write-Host "🎁 Erstelle Gift Cards Module..." -ForegroundColor Yellow

@"
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGiftCardDto {
  @ApiProperty() @IsNumber() @Min(5) amount: number;
  @ApiPropertyOptional() @IsString() @IsOptional() recipientEmail?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() recipientName?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() message?: string;
}
"@ | Out-File -FilePath "src/gift-cards/dto/create-gift-card.dto.ts" -Encoding utf8

@"
import { CreateGiftCardDto } from './create-gift-card.dto';
export class PurchaseGiftCardDto extends CreateGiftCardDto {}
"@ | Out-File -FilePath "src/gift-cards/dto/purchase-gift-card.dto.ts" -Encoding utf8

@"
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class ValidateGiftCardDto {
  @ApiProperty() @IsString() code: string;
}
"@ | Out-File -FilePath "src/gift-cards/dto/validate-gift-card.dto.ts" -Encoding utf8

@"
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGiftCardDto } from './dto/create-gift-card.dto';

@Injectable()
export class GiftCardsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGiftCardDto) {
    return this.prisma.giftCard.create({
      data: { ...dto, code: this.generateCode(), balance: dto.amount, initialAmount: dto.amount },
    });
  }

  async purchase(userId: string, dto: CreateGiftCardDto) {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    return this.prisma.giftCard.create({
      data: { ...dto, code: this.generateCode(), balance: dto.amount, initialAmount: dto.amount, expiresAt, userId },
    });
  }

  async validate(code: string) {
    const gc = await this.prisma.giftCard.findUnique({ where: { code }});
    if (!gc) throw new NotFoundException('Gutschein nicht gefunden');
    if (!gc.isActive) throw new BadRequestException('Gutschein ist nicht aktiv');
    if (gc.balance <= 0) throw new BadRequestException('Gutschein aufgebraucht');
    return { valid: true, balance: gc.balance };
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return 'GC-' + Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
    ).join('-');
  }
}
"@ | Out-File -FilePath "src/gift-cards/gift-cards.service.ts" -Encoding utf8

@"
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GiftCardsService } from './gift-cards.service';
import { PurchaseGiftCardDto } from './dto/purchase-gift-card.dto';
import { ValidateGiftCardDto } from './dto/validate-gift-card.dto';
import { CreateGiftCardDto } from './dto/create-gift-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('gift-cards')
@Controller('gift-cards')
export class GiftCardsController {
  constructor(private readonly service: GiftCardsService) {}
  @Post('purchase') @UseGuards(JwtAuthGuard) @ApiBearerAuth() purchase(@GetUser('id') userId: string, @Body() dto: PurchaseGiftCardDto) { return this.service.purchase(userId, dto); }
  @Post('validate') @Public() validate(@Body() dto: ValidateGiftCardDto) { return this.service.validate(dto.code); }
}

@ApiTags('admin/gift-cards')
@Controller('admin/gift-cards')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminGiftCardsController {
  constructor(private readonly service: GiftCardsService) {}
  @Post() create(@Body() dto: CreateGiftCardDto) { return this.service.create(dto); }
}
"@ | Out-File -FilePath "src/gift-cards/gift-cards.controller.ts" -Encoding utf8

@"
import { Module } from '@nestjs/common';
import { GiftCardsService } from './gift-cards.service';
import { GiftCardsController, AdminGiftCardsController } from './gift-cards.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GiftCardsController, AdminGiftCardsController],
  providers: [GiftCardsService],
  exports: [GiftCardsService],
})
export class GiftCardsModule {}
"@ | Out-File -FilePath "src/gift-cards/gift-cards.module.ts" -Encoding utf8

# PLACEHOLDER MODULE (vereinfacht)
Write-Host "📝 Erstelle Placeholder Module..." -ForegroundColor Yellow

$modules = @('tickets', 'newsletter', 'reviews', 'search', 'shipping', 'cookies', 'gdpr', 'tax', 'legal')

foreach ($module in $modules) {
    $ModuleName = (Get-Culture).TextInfo.ToTitleCase($module)
    
    @"
import { Injectable } from '@nestjs/common';
@Injectable()
export class ${ModuleName}Service {}
"@ | Out-File -FilePath "src/$module/$module.service.ts" -Encoding utf8

    @"
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ${ModuleName}Service } from './$module.service';
@ApiTags('$module')
@Controller('$module')
export class ${ModuleName}Controller {
  constructor(private readonly service: ${ModuleName}Service) {}
}
"@ | Out-File -FilePath "src/$module/$module.controller.ts" -Encoding utf8

    @"
import { Module } from '@nestjs/common';
import { ${ModuleName}Service } from './$module.service';
import { ${ModuleName}Controller } from './$module.controller';
@Module({
  controllers: [${ModuleName}Controller],
  providers: [${ModuleName}Service],
  exports: [${ModuleName}Service],
})
export class ${ModuleName}Module {}
"@ | Out-File -FilePath "src/$module/$module.module.ts" -Encoding utf8
}

# APP.MODULE.TS
Write-Host "🔧 Update app.module.ts..." -ForegroundColor Yellow

@"
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { GiftCardsModule } from './gift-cards/gift-cards.module';
import { DiscountsModule } from './discounts/discounts.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SearchModule } from './search/search.module';
import { ShippingModule } from './shipping/shipping.module';
import { TicketsModule } from './tickets/tickets.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CookiesModule } from './cookies/cookies.module';
import { GdprModule } from './gdpr/gdpr.module';
import { TaxModule } from './tax/tax.module';
import { LegalModule } from './legal/legal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule, HealthModule, AuthModule, UsersModule,
    ProductsModule, CategoriesModule, CartModule, OrdersModule,
    PaymentsModule, GiftCardsModule, DiscountsModule, ReviewsModule,
    SearchModule, ShippingModule, TicketsModule, NewsletterModule,
    AnalyticsModule, CookiesModule, GdprModule, TaxModule, LegalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
"@ | Out-File -FilePath "src/app.module.ts" -Encoding utf8

Write-Host ""
Write-Host "✅ FERTIG! Alle Dateien erstellt!" -ForegroundColor Green
Write-Host ""
Write-Host "Nächste Schritte:" -ForegroundColor Cyan
Write-Host "1. npm install" -ForegroundColor White
Write-Host "2. npx prisma generate" -ForegroundColor White
Write-Host "3. npm run start:dev" -ForegroundColor White
Write-Host ""