import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsController,
  AdminAnalyticsController,
} from './analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController, AdminAnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}