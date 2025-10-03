import { Module } from '@nestjs/common';
import {
  ReturnsController,
  AdminReturnsController,
} from './returns.controller';
import { ReturnsService } from './returns.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReturnsController, AdminReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
