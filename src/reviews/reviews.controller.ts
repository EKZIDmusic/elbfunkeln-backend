import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { Public, GetUser, Roles } from '../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { UserRole } from '@prisma/client';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Public()
  @Get('product/:productId')
  @ApiOperation({ summary: 'Get product reviews' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  getProductReviews(@Param('productId', ParseUuidPipe) productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }

  // ==================== CUSTOMER ENDPOINTS ====================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Already reviewed this product' })
  create(
    @GetUser('id') userId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, createReviewDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my-reviews')
  @ApiOperation({ summary: 'Get user reviews' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  getUserReviews(@GetUser('id') userId: string) {
    return this.reviewsService.getUserReviews(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 403, description: 'Not your review' })
  update(
    @GetUser('id') userId: string,
    @Param('id', ParseUuidPipe) reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(userId, reviewId, updateReviewDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not your review' })
  remove(
    @GetUser('id') userId: string,
    @Param('id', ParseUuidPipe) reviewId: string,
  ) {
    return this.reviewsService.remove(userId, reviewId);
  }
}

@ApiTags('Admin - Reviews')
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SHOP_OWNER)
@ApiBearerAuth()
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reviews (Admin)' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  getAllReviews(@Query('approved') approved?: string) {
    const isApproved =
      approved !== undefined ? approved === 'true' : undefined;
    return this.reviewsService.getAllReviews(isApproved);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get review statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  getReviewStats() {
    return this.reviewsService.getReviewStats();
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve review (Admin)' })
  @ApiResponse({ status: 200, description: 'Review approved successfully' })
  approveReview(@Param('id', ParseUuidPipe) reviewId: string) {
    return this.reviewsService.approveReview(reviewId);
  }

  @Delete(':id/reject')
  @ApiOperation({ summary: 'Reject and delete review (Admin)' })
  @ApiResponse({ status: 200, description: 'Review rejected successfully' })
  rejectReview(@Param('id', ParseUuidPipe) reviewId: string) {
    return this.reviewsService.rejectReview(reviewId);
  }
}