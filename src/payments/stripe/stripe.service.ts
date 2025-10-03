import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    
    if (!secretKey) {
      throw new Error('Stripe secret key is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });
  }

  /**
   * Create Payment Intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: metadata || {},
      });

      this.logger.log(`Payment Intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Error creating payment intent:', error);
      throw new BadRequestException('Fehler beim Erstellen der Zahlung');
    }
  }

  /**
   * Retrieve Payment Intent
   */
  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error('Error retrieving payment intent:', error);
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
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
        },
      );

      this.logger.log(`Payment Intent confirmed: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Error confirming payment intent:', error);
      throw new BadRequestException('Fehler beim Bestätigen der Zahlung');
    }
  }

  /**
   * Cancel Payment Intent
   */
  async cancelPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(
        paymentIntentId,
      );

      this.logger.log(`Payment Intent cancelled: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Error cancelling payment intent:', error);
      throw new BadRequestException('Fehler beim Stornieren der Zahlung');
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
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason: reason as Stripe.RefundCreateParams.Reason,
      });

      this.logger.log(`Refund created: ${refund.id} for PI: ${paymentIntentId}`);
      return refund;
    } catch (error) {
      this.logger.error('Error creating refund:', error);
      throw new BadRequestException('Fehler beim Erstellen der Rückerstattung');
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
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: metadata || {},
      });

      this.logger.log(`Customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error('Error creating customer:', error);
      throw new BadRequestException('Fehler beim Erstellen des Kunden');
    }
  }

  /**
   * Retrieve Customer
   */
  async retrieveCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      return (await this.stripe.customers.retrieve(customerId)) as Stripe.Customer;
    } catch (error) {
      this.logger.error('Error retrieving customer:', error);
      throw new BadRequestException('Kunde nicht gefunden');
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
      const paymentMethod = await this.stripe.paymentMethods.attach(
        paymentMethodId,
        { customer: customerId },
      );

      this.logger.log(
        `Payment Method ${paymentMethodId} attached to customer ${customerId}`,
      );
      return paymentMethod;
    } catch (error) {
      this.logger.error('Error attaching payment method:', error);
      throw new BadRequestException('Fehler beim Hinzufügen der Zahlungsmethode');
    }
  }

  /**
   * Detach Payment Method from Customer
   */
  async detachPaymentMethod(
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(
        paymentMethodId,
      );

      this.logger.log(`Payment Method detached: ${paymentMethodId}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error('Error detaching payment method:', error);
      throw new BadRequestException('Fehler beim Entfernen der Zahlungsmethode');
    }
  }

  /**
   * List Payment Methods for Customer
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
      this.logger.error('Error listing payment methods:', error);
      throw new BadRequestException('Fehler beim Abrufen der Zahlungsmethoden');
    }
  }

  /**
   * Set Default Payment Method
   */
  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      this.logger.log(
        `Default payment method set for customer ${customerId}`,
      );
      return customer;
    } catch (error) {
      this.logger.error('Error setting default payment method:', error);
      throw new BadRequestException(
        'Fehler beim Setzen der Standard-Zahlungsmethode',
      );
    }
  }

  /**
   * Construct Webhook Event
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
  ): Stripe.Event {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error('Webhook signature verification failed:', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Get Stripe Instance (for advanced usage)
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}