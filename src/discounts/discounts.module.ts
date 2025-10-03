import { Module } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import {
  DiscountsController,
  AdminDiscountsController,
} from './discounts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DiscountsController, AdminDiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}