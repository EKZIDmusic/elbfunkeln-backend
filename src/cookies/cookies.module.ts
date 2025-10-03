import { Module } from '@nestjs/common';
import { CookiesController } from './cookies.controller';
import { CookiesService } from './cookies.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CookiesController],
  providers: [CookiesService],
  exports: [CookiesService],
})
export class CookiesModule {}
