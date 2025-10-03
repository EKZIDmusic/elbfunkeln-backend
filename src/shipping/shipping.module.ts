import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  ShippingController,
  AdminShippingController,
} from './shipping.controller';
import { ShippingService } from './shipping.service';
import { DhlService } from './dhl/dhl.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [ShippingController, AdminShippingController],
  providers: [ShippingService, DhlService],
  exports: [ShippingService, DhlService],
})
export class ShippingModule {}
