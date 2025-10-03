import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubscribeNewsletterDto,
  UnsubscribeNewsletterDto,
  CreateCampaignDto,
} from './dto/newsletter.dto';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class NewsletterService {
  constructor(private prisma: PrismaService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  async subscribe(subscribeDto: SubscribeNewsletterDto) {
    const { email, firstName, lastName } = subscribeDto;

    // Check if already subscribed
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === SubscriptionStatus.SUBSCRIBED) {
        throw new ConflictException('Email is already subscribed');
      }

      // Reactivate subscription
      await this.prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          status: SubscriptionStatus.SUBSCRIBED,
          firstName,
          lastName,
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
      });

      return {
        message: 'Successfully resubscribed to newsletter',
      };
    }

    // Create new subscription
    await this.prisma.newsletterSubscriber.create({
      data: {
        email,
        firstName,
        lastName,
        status: SubscriptionStatus.SUBSCRIBED,
      },
    });

    // TODO: Send welcome email

    return {
      message: 'Successfully subscribed to newsletter',
    };
  }

  async unsubscribe(unsubscribeDto: UnsubscribeNewsletterDto) {
    const { email } = unsubscribeDto;

    const subscriber = await this.prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (!subscriber) {
      throw new NotFoundException('Email not found in newsletter list');
    }

    if (subscriber.status === SubscriptionStatus.UNSUBSCRIBED) {
      return {
        message: 'Email is already unsubscribed',
      };
    }

    await this.prisma.newsletterSubscriber.update({
      where: { email },
      data: {
        status: SubscriptionStatus.UNSUBSCRIBED,
        unsubscribedAt: new Date(),
      },
    });

    return {
      message: 'Successfully unsubscribed from newsletter',
    };
  }

  // ==================== ADMIN ENDPOINTS ====================

  async getSubscribers(status?: SubscriptionStatus) {
    const where = status ? { status } : {};

    return this.prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { subscribedAt: 'desc' },
    });
  }

  async createCampaign(createCampaignDto: CreateCampaignDto) {
    const { name, subject, content } = createCampaignDto;

    return this.prisma.newsletterCampaign.create({
      data: {
        name,
        subject,
        content,
      },
    });
  }

  async getCampaigns() {
    return this.prisma.newsletterCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaign(id: string) {
    const campaign = await this.prisma.newsletterCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async sendCampaign(campaignId: string) {
    const campaign = await this.getCampaign(campaignId);

    if (campaign.sentAt) {
      throw new ConflictException('Campaign has already been sent');
    }

    // Get all subscribed users
    const subscribers = await this.prisma.newsletterSubscriber.findMany({
      where: { status: SubscriptionStatus.SUBSCRIBED },
    });

    // TODO: Send emails to all subscribers using email service
    // For now, just update the campaign

    await this.prisma.newsletterCampaign.update({
      where: { id: campaignId },
      data: {
        sentAt: new Date(),
        recipientCount: subscribers.length,
      },
    });

    return {
      message: 'Campaign sent successfully',
      recipientCount: subscribers.length,
    };
  }

  async getStats() {
    const [totalSubscribers, activeSubscribers, unsubscribed, totalCampaigns] =
      await Promise.all([
        this.prisma.newsletterSubscriber.count(),
        this.prisma.newsletterSubscriber.count({
          where: { status: SubscriptionStatus.SUBSCRIBED },
        }),
        this.prisma.newsletterSubscriber.count({
          where: { status: SubscriptionStatus.UNSUBSCRIBED },
        }),
        this.prisma.newsletterCampaign.count(),
      ]);

    const sentCampaigns = await this.prisma.newsletterCampaign.count({
      where: { sentAt: { not: null } },
    });

    return {
      totalSubscribers,
      activeSubscribers,
      unsubscribed,
      totalCampaigns,
      sentCampaigns,
    };
  }
}
