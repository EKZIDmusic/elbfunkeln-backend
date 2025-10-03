import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookHandler {
  private readonly logger = new Logger(StripeWebhookHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Handle Stripe Webhook Events
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Received webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      default:
        this.logger.warn(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Payment Intent Succeeded
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
      const order = await this.prisma.order.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (!order) {
        this.logger.warn(`Order not found for payment intent: ${paymentIntent.id}`);
        return;
      }

      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          isPaid: true,
          paidAt: new Date(),
          status: OrderStatus.CONFIRMED,
        },
      });

      this.logger.log(`Order ${order.orderNumber} marked as paid`);

      // TODO: Send order confirmation email
    } catch (error) {
      this.logger.error('Error handling payment_intent.succeeded', error);
    }
  }

  /**
   * Payment Intent Failed
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
      const order = await this.prisma.order.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (!order) {
        this.logger.warn(`Order not found for payment intent: ${paymentIntent.id}`);
        return;
      }

      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          adminNotes: `Zahlung fehlgeschlagen: ${paymentIntent.last_payment_error?.message || 'Unbekannter Fehler'}`,
        },
      });

      this.logger.log(`Order ${order.orderNumber} marked as cancelled due to payment failure`);

      // Restore product stock
      const orderItems = await this.prisma.orderItem.findMany({
        where: { orderId: order.id },
      });

      for (const item of orderItems) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            soldCount: { decrement: item.quantity },
          },
        });
      }

      // TODO: Send payment failed email
    } catch (error) {
      this.logger.error('Error handling payment_intent.payment_failed', error);
    }
  }

  /**
   * Payment Intent Canceled
   */
  private async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
    try {
      const order = await this.prisma.order.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (!order) {
        this.logger.warn(`Order not found for payment intent: ${paymentIntent.id}`);
        return;
      }

      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          adminNotes: 'Zahlung wurde storniert',
        },
      });

      this.logger.log(`Order ${order.orderNumber} cancelled`);

      // Restore product stock
      const orderItems = await this.prisma.orderItem.findMany({
        where: { orderId: order.id },
      });

      for (const item of orderItems) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            soldCount: { decrement: item.quantity },
          },
        });
      }
    } catch (error) {
      this.logger.error('Error handling payment_intent.canceled', error);
    }
  }

  /**
   * Charge Refunded
   */
  private async handleChargeRefunded(charge: Stripe.Charge) {
    try {
      const order = await this.prisma.order.findFirst({
        where: { stripePaymentIntentId: charge.payment_intent as string },
      });

      if (!order) {
        this.logger.warn(`Order not found for charge: ${charge.id}`);
        return;
      }

      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.REFUNDED,
          adminNotes: `Rückerstattung durchgeführt: ${charge.amount_refunded / 100}€`,
        },
      });

      this.logger.log(`Order ${order.orderNumber} refunded`);

      // TODO: Send refund confirmation email
    } catch (error) {
      this.logger.error('Error handling charge.refunded', error);
    }
  }

  /**
   * Dispute Created
   */
  private async handleDisputeCreated(dispute: Stripe.Dispute) {
    try {
      const order = await this.prisma.order.findFirst({
        where: { stripePaymentIntentId: dispute.payment_intent as string },
      });

      if (!order) {
        this.logger.warn(`Order not found for dispute: ${dispute.id}`);
        return;
      }

      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          adminNotes: `Zahlungsstreit eröffnet: ${dispute.reason}`,
        },
      });

      this.logger.warn(`Dispute created for order ${order.orderNumber}`);

      // TODO: Send admin notification email
    } catch (error) {
      this.logger.error('Error handling charge.dispute.created', error);
    }
  }
}