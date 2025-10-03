import { Module } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import {
  NewsletterController,
  AdminNewsletterController,
} from './newsletter.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NewsletterController, AdminNewsletterController],
  providers: [NewsletterService],
  exports: [NewsletterService],
})
export class NewsletterModule {}