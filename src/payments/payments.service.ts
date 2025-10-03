import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe/stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
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
    const { amount, currency, orderId, description, metadata } = createPaymentIntentDto;

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
      {
        userId,
        orderId: orderId || '',
        customerEmail: user.email,
        ...metadata,
      },
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  }

  /**
   * Get Payment Intent Status
   */
  async getPaymentIntentStatus(paymentIntentId: string) {
    const paymentIntent = await this.stripeService.retrievePaymentIntent(
      paymentIntentId,
    );

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: new Date(paymentIntent.created * 1000),
    };
  }

  /**
   * Confirm Payment
   */
  async confirmPayment(paymentIntentId: string, paymentMethodId: string) {
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
    const paymentIntent = await this.stripeService.cancelPaymentIntent(
      paymentIntentId,
    );

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      message: 'Zahlung erfolgreich storniert',
    };
  }

  /**
   * Get Available Payment Methods
   */
  getAvailablePaymentMethods() {
    return [
      {
        id: 'card',
        name: 'Kreditkarte',
        types: ['Visa', 'Mastercard', 'American Express'],
        icon: 'credit-card',
      },
      {
        id: 'sepa_debit',
        name: 'SEPA-Lastschrift',
        types: ['SEPA'],
        icon: 'bank',
      },
      {
        id: 'sofort',
        name: 'Sofortüberweisung',
        types: ['Sofort'],
        icon: 'transfer',
      },
      {
        id: 'klarna',
        name: 'Klarna',
        types: ['Pay now', 'Pay later'],
        icon: 'klarna',
      },
    ];
  }

  /**
   * Save Payment Method
   */
  async savePaymentMethod(
    userId: string,
    savePaymentMethodDto: SavePaymentMethodDto,
  ) {
    const { paymentMethodId, setAsDefault } = savePaymentMethodDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeCustomerId) {
      throw new NotFoundException('Stripe-Kunde nicht gefunden');
    }

    // Attach payment method to customer
    await this.stripeService.attachPaymentMethod(
      paymentMethodId,
      user.stripeCustomerId,
    );

    // Set as default if requested
    if (setAsDefault) {
      await this.stripeService.setDefaultPaymentMethod(
        user.stripeCustomerId,
        paymentMethodId,
      );
    }

    return {
      message: 'Zahlungsmethode erfolgreich gespeichert',
      paymentMethodId,
      isDefault: setAsDefault || false,
    };
  }

  /**
   * Get Saved Payment Methods
   */
  async getSavedPaymentMethods(userId: string): Promise<PaymentMethodResponseDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeCustomerId) {
      return [];
    }

    const paymentMethods = await this.stripeService.listPaymentMethods(
      user.stripeCustomerId,
    );

    const customer = await this.stripeService.retrieveCustomer(
      user.stripeCustomerId,
    );

    const defaultPaymentMethodId =
      customer.invoice_settings?.default_payment_method as string | null;

    return paymentMethods.map((pm) => ({
      id: pm.id,
      type: pm.type,
      card: pm.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
          }
        : undefined,
      isDefault: pm.id === defaultPaymentMethodId,
      createdAt: new Date(pm.created * 1000),
    }));
  }

  /**
   * Delete Payment Method
   */
  async deletePaymentMethod(userId: string, paymentMethodId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeCustomerId) {
      throw new NotFoundException('Stripe-Kunde nicht gefunden');
    }

    // Verify payment method belongs to user
    const paymentMethods = await this.stripeService.listPaymentMethods(
      user.stripeCustomerId,
    );

    const paymentMethod = paymentMethods.find((pm) => pm.id === paymentMethodId);

    if (!paymentMethod) {
      throw new NotFoundException('Zahlungsmethode nicht gefunden');
    }

    await this.stripeService.detachPaymentMethod(paymentMethodId);

    return {
      message: 'Zahlungsmethode erfolgreich gelöscht',
    };
  }
}