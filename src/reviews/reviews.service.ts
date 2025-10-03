import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  async getProductReviews(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: {
        productId,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

    // Rating distribution
    const distribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return {
      reviews,
      summary: {
        total: reviews.length,
        averageRating: Number(avgRating.toFixed(1)),
        distribution,
      },
    };
  }

  // ==================== CUSTOMER ENDPOINTS ====================

  async create(userId: string, createReviewDto: CreateReviewDto) {
    const { productId, rating, title, comment } = createReviewDto;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user has purchased this product
    const hasPurchased = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'DELIVERED',
        },
      },
    });

    const isVerified = !!hasPurchased;

    // Check if user already reviewed this product
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (existingReview) {
      throw new BadRequestException(
        'You have already reviewed this product. You can update your existing review instead.',
      );
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        title,
        comment,
        isVerified,
        isApproved: false, // Needs admin approval
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return review;
  }

  async getUserReviews(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              where: { isMain: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    userId: string,
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...updateReviewDto,
        isApproved: false, // Reset approval status after edit
      },
    });
  }

  async remove(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    return { message: 'Review deleted successfully' };
  }

  // ==================== ADMIN ENDPOINTS ====================

  async getAllReviews(isApproved?: boolean) {
    const where = isApproved !== undefined ? { isApproved } : {};

    return this.prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveReview(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: true },
    });
  }

  async rejectReview(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    return { message: 'Review rejected and deleted' };
  }

  async getReviewStats() {
    const [totalReviews, pendingReviews, approvedReviews, verifiedReviews] =
      await Promise.all([
        this.prisma.review.count(),
        this.prisma.review.count({ where: { isApproved: false } }),
        this.prisma.review.count({ where: { isApproved: true } }),
        this.prisma.review.count({ where: { isVerified: true } }),
      ]);

    return {
      totalReviews,
      pendingReviews,
      approvedReviews,
      verifiedReviews,
    };
  }
}
