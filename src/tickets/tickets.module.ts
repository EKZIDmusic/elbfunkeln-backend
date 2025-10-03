import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import {
  TicketsController,
  AdminTicketsController,
} from './tickets.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TicketsController, AdminTicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}