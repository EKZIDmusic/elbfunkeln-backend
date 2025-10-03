
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  /**
   * Create Payment Intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    paymentMethodTypes: string[],
    metadata?: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        payment_method_types: paymentMethodTypes,
        metadata,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      });

      this.logger.log(`Payment Intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to create payment intent', error);
      throw new BadRequestException('Fehler beim Erstellen der Zahlung');
    }
  }

  /**
   * Retrieve Payment Intent
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`Failed to retrieve payment intent: ${paymentIntentId}`, error);
      throw new BadRequestException('Zahlung nicht gefunden');
    }
  }

  /**
   * Confirm Payment Intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });
    } catch (error) {
      this.logger.error('Failed to confirm payment intent', error);
      throw new BadRequestException('Zahlung konnte nicht bestätigt werden');
    }
  }

  /**
   * Cancel Payment Intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.cancel(paymentIntentId);
    } catch (error) {
      this.logger.error('Failed to cancel payment intent', error);
      throw new BadRequestException('Zahlung konnte nicht storniert werden');
    }
  }

  /**
   * Create Refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string,
  ): Promise<Stripe.Refund> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = amount;
      }

      if (reason) {
        refundData.reason = reason as Stripe.RefundCreateParams.Reason;
      }

      const refund = await this.stripe.refunds.create(refundData);
      this.logger.log(`Refund created: ${refund.id}`);
      return refund;
    } catch (error) {
      this.logger.error('Failed to create refund', error);
      throw new BadRequestException('Rückerstattung konnte nicht durchgeführt werden');
    }
  }

  /**
   * Create Customer
   */
  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.create({
        email,
        name,
        metadata,
      });
    } catch (error) {
      this.logger.error('Failed to create customer', error);
      throw new BadRequestException('Kunde konnte nicht erstellt werden');
    }
  }

  /**
   * Attach Payment Method to Customer
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<Stripe.PaymentMethod> {
    try {
      return await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } catch (error) {
      this.logger.error('Failed to attach payment method', error);
      throw new BadRequestException('Zahlungsmethode konnte nicht gespeichert werden');
    }
  }

  /**
   * Detach Payment Method
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      return await this.stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      this.logger.error('Failed to detach payment method', error);
      throw new BadRequestException('Zahlungsmethode konnte nicht gelöscht werden');
    }
  }

  /**
   * List Customer Payment Methods
   */
  async listPaymentMethods(
    customerId: string,
    type: Stripe.PaymentMethodListParams.Type = 'card',
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type,
      });
      return paymentMethods.data;
    } catch (error) {
      this.logger.error('Failed to list payment methods', error);
      throw new BadRequestException('Zahlungsmethoden konnten nicht geladen werden');
    }
  }

  /**
   * Construct Webhook Event
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
  ): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Failed to construct webhook event', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Get Stripe instance (for advanced usage)
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}