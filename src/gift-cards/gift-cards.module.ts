import { Module } from '@nestjs/common';
import { GiftCardsService } from './gift-cards.service';
import {
  GiftCardsController,
  AdminGiftCardsController,
} from './gift-cards.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GiftCardsController, AdminGiftCardsController],
  providers: [GiftCardsService],
  exports: [GiftCardsService],
})
export class GiftCardsModule {}