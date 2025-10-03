import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import {
  CategoriesController,
  AdminCategoriesController,
} from './categories.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}