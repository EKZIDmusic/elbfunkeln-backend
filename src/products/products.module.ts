import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  ProductsController,
  AdminProductsController,
} from './products.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}