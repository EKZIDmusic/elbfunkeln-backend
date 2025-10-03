import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe/stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { SavePaymentMethodDto, PaymentMethodResponseDto } from './dto/payment-method.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Create Payment Intent
   */
  async createPaymentIntent(
    userId: string,
    createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    const { amount, currency, paymentMethodTypes, metadata, orderId } = createPaymentIntentDto;

    // Get or create Stripe customer
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Benutzer nicht gefunden');
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(
        user.email,
        `${user.firstName} ${user.lastName}`,
        { userId: user.id },
      );
      stripeCustomerId = customer.id;

      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // Create payment intent
    const paymentIntent = await this.stripeService.createPaymentIntent(
      amount,
      currency,
      paymentMethodTypes,
      {
        ...metadata,
        userId,
        orderId: orderId || '',
        customerEmail: user.email,
      },
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };
  }

  /**
   * Get Payment Intent Status
   */
  async getPaymentIntentStatus(paymentIntentId: string) {
    const paymentIntent = await this.stripeService.retrievePaymentIntent(paymentIntentId);

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentMethod: paymentIntent.payment_method,
      created: new Date(paymentIntent.created * 1000),
    };
  }

  /**
   * Confirm Payment
   */
  async confirmPayment(confirmPaymentDto: ConfirmPaymentDto) {
    const { paymentIntentId, paymentMethodId } = confirmPaymentDto;

    const paymentIntent = await this.stripeService.confirmPaymentIntent(
      paymentIntentId,
      paymentMethodId,
    );

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  }

  /**
   * Cancel Payment
   */
  async cancelPayment(paymentIntentId: string) {
    const paymentIntent = await this.stripeService.cancelPaymentIntent(paymentIntentId);

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      message: 'Zahlung erfolgreich storniert',
    };
  }

  /**
   * Get Available Payment Methods
   */
  async getAvailablePaymentMethods() {
    return {
      methods: [
        {
          type: 'card',
          name: 'Kreditkarte',
          description: 'Visa, Mastercard, American Express',
          icon: '💳',
          enabled: true,
        },
        {
          type: 'sepa_debit',
          name: 'SEPA-Lastschrift',
          description: 'Bankeinzug',
          icon: '🏦',
          enabled: true,
        },
        {
          type: 'sofort',
          name: 'Sofortüberweisung',
          description: 'Sofort bezahlen',
          icon: '⚡',
          enabled: true,
        },
        {
          type: 'klarna',
          name: 'Klarna',
          description: 'Später bezahlen',
          icon: '🛍️',
          enabled: false,
        },
        {
          type: 'apple_pay',
          name: 'Apple Pay',
          description: 'Apple Pay',
          icon: '🍎',
          enabled: true,
        },
        {
          type: 'google_pay',
          name: 'Google Pay',
          description: 'Google Pay',
          icon: '🔵',
          enabled: true,
        },
      ],
    };
  }

  /**
   * Save Payment Method
   */
  async savePaymentMethod(
    userId: string,
    savePaymentMethodDto: SavePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      throw new NotFoundException('Stripe-Kunde nicht gefunden');
    }

    const paymentMethod = await this.stripeService.attachPaymentMethod(
      savePaymentMethodDto.paymentMethodId,
      user.stripeCustomerId,
    );

    // TODO: Save to database if needed

    return this.formatPaymentMethod(paymentMethod, savePaymentMethodDto.setAsDefault || false);
  }

  /**
   * Get Saved Payment Methods
   */
  async getSavedPaymentMethods(userId: string): Promise<PaymentMethodResponseDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      return [];
    }

    const paymentMethods = await this.stripeService.listPaymentMethods(user.stripeCustomerId);

    return paymentMethods.map((pm) => this.formatPaymentMethod(pm, false));
  }

  /**
   * Delete Payment Method
   */
  async deletePaymentMethod(userId: string, paymentMethodId: string) {
    await this.stripeService.detachPaymentMethod(paymentMethodId);

    return {
      message: 'Zahlungsmethode erfolgreich gelöscht',
    };
  }

  /**
   * Format Payment Method for Response
   */
  private formatPaymentMethod(
    paymentMethod: any,
    isDefault: boolean,
  ): PaymentMethodResponseDto {
    const formatted: PaymentMethodResponseDto = {
      id: paymentMethod.id,
      type: paymentMethod.type,
      isDefault,
      createdAt: new Date(paymentMethod.created * 1000),
    };

    if (paymentMethod.card) {
      formatted.card = {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
      };
    }

    if (paymentMethod.sepa_debit) {
      formatted.sepaDebit = {
        last4: paymentMethod.sepa_debit.last4,
        bankCode: paymentMethod.sepa_debit.bank_code,
      };
    }

    return formatted;
  }
}