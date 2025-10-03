import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validate } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { DiscountsModule } from './discounts/discounts.module';
import { GiftCardsModule } from './gift-cards/gift-cards.module';
import { TicketsModule } from './tickets/tickets.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ShippingModule } from './shipping/shipping.module';
import { ReturnsModule } from './returns/returns.module';
import { KpisModule } from './kpis/kpis.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SocialModule } from './social/social.module';
import { AccountingModule } from './accounting/accounting.module';
import { LegalModule } from './legal/legal.module';
import { CookiesModule } from './cookies/cookies.module';
import { SearchModule } from './search/search.module';
import { TaxModule } from './tax/tax.module';
import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 1000, // 1000 requests per minute
      },
    ]),

    // Core Modules
    PrismaModule,
    AuthModule,

    // Feature Modules
    UsersModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    ReviewsModule,
    DiscountsModule,
    GiftCardsModule,
    TicketsModule,
    NewsletterModule,
    AnalyticsModule,
    HealthModule,
    ShippingModule,
    ReturnsModule,
    KpisModule,
    DashboardModule,
    SocialModule,
    AccountingModule,
    LegalModule,
    CookiesModule,
    SearchModule,
    TaxModule,
    IntegrationsModule,
  ],
  providers: [
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
