import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe/stripe.service';
import { StripeWebhookHandler } from './stripe/stripe.webhook';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { SavePaymentMethodDto } from './dto/payment-method.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
    private readonly webhookHandler: StripeWebhookHandler,
  ) {}

  // ==================== Payment Intent Endpoints ====================

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent' })
  @ApiResponse({ status: 201, description: 'Payment intent created' })
  async createPaymentIntent(
    @GetUser('id') userId: string,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(
      userId,
      createPaymentIntentDto,
    );
  }

  @Get('intent/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment intent status' })
  @ApiResponse({ status: 200, description: 'Payment intent retrieved' })
  async getPaymentIntent(@Param('id') paymentIntentId: string) {
    return this.paymentsService.getPaymentIntentStatus(paymentIntentId);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm payment' })
  @ApiResponse({ status: 200, description: 'Payment confirmed' })
  async confirmPayment(@Body() confirmPaymentDto: ConfirmPaymentDto) {
    return this.paymentsService.confirmPayment(
      confirmPaymentDto.paymentIntentId,
      confirmPaymentDto.paymentMethodId,
    );
  }

  @Post('cancel/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel payment' })
  @ApiResponse({ status: 200, description: 'Payment cancelled' })
  async cancelPayment(@Param('id') paymentIntentId: string) {
    return this.paymentsService.cancelPayment(paymentIntentId);
  }

  // ==================== Payment Methods ====================

  @Get('methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available payment methods' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved' })
  getAvailablePaymentMethods() {
    return this.paymentsService.getAvailablePaymentMethods();
  }

  @Post('save-method')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save payment method' })
  @ApiResponse({ status: 201, description: 'Payment method saved' })
  async savePaymentMethod(
    @GetUser('id') userId: string,
    @Body() savePaymentMethodDto: SavePaymentMethodDto,
  ) {
    return this.paymentsService.savePaymentMethod(userId, savePaymentMethodDto);
  }

  @Get('saved-methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get saved payment methods' })
  @ApiResponse({ status: 200, description: 'Saved payment methods retrieved' })
  async getSavedPaymentMethods(@GetUser('id') userId: string) {
    return this.paymentsService.getSavedPaymentMethods(userId);
  }

  @Delete('methods/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete payment method' })
  @ApiResponse({ status: 204, description: 'Payment method deleted' })
  async deletePaymentMethod(
    @GetUser('id') userId: string,
    @Param('id') paymentMethodId: string,
  ) {
    await this.paymentsService.deletePaymentMethod(userId, paymentMethodId);
  }

  // ==================== Webhook ====================

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    const rawBody = request.rawBody;

    if (!rawBody) {
      throw new Error('Raw body is required for webhook signature verification');
    }

    const event = this.stripeService.constructWebhookEvent(rawBody, signature);
    await this.webhookHandler.handleWebhookEvent(event);

    return { received: true };
  }
}