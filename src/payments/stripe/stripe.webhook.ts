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
    this.logger.log(`Handling webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await this.handlePaymentIntentCanceled(event.data.object);
        break;

      case 'charge.succeeded':
        await this.handleChargeSucceeded(event.data.object);
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object);
        break;

      case 'customer.created':
        this.logger.log('Customer created in Stripe');
        break;

      case 'payment_method.attached':
        this.logger.log('Payment method attached to customer');
        break;

      default:
        this.logger.warn(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    try {
      const orderId = paymentIntent.metadata?.orderId;

      if (!orderId) {
        this.logger.warn('No orderId in payment intent metadata');
        return;
      }

      // Update order status
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          paidAt: new Date(),
          status: OrderStatus.CONFIRMED,
          stripePaymentIntentId: paymentIntent.id,
        },
      });

      this.logger.log(`Order ${orderId} marked as paid`);

      // TODO: Send confirmation email
      // await this.emailService.sendOrderConfirmation(order);
    } catch (error) {
      this.logger.error('Error handling payment success:', error);
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    try {
      const orderId = paymentIntent.metadata?.orderId;

      if (!orderId) {
        this.logger.warn('No orderId in payment intent metadata');
        return;
      }

      // Update order status
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAYMENT_FAILED,
          adminNotes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
        },
      });

      this.logger.log(`Order ${orderId} marked as payment failed`);

      // Restore product stock
      const orderItems = await this.prisma.orderItem.findMany({
        where: { orderId },
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
      // await this.emailService.sendPaymentFailed(order);
    } catch (error) {
      this.logger.error('Error handling payment failure:', error);
    }
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    try {
      const orderId = paymentIntent.metadata?.orderId;

      if (!orderId) {
        this.logger.warn('No orderId in payment intent metadata');
        return;
      }

      // Update order status
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          adminNotes: 'Payment intent was cancelled',
        },
      });

      this.logger.log(`Order ${orderId} marked as cancelled`);

      // Restore product stock
      const orderItems = await this.prisma.orderItem.findMany({
        where: { orderId },
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
      this.logger.error('Error handling payment cancellation:', error);
    }
  }

  /**
   * Handle successful charge
   */
  private async handleChargeSucceeded(charge: Stripe.Charge): Promise<void> {
    this.logger.log(`Charge succeeded: ${charge.id}`);
    // Additional charge handling logic can be added here
  }

  /**
   * Handle refunded charge
   */
  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    try {
      const paymentIntentId = charge.payment_intent as string;

      if (!paymentIntentId) {
        this.logger.warn('No payment intent ID in charge');
        return;
      }

      // Find order by payment intent ID
      const order = await this.prisma.order.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (!order) {
        this.logger.warn(
          `No order found for payment intent ${paymentIntentId}`,
        );
        return;
      }

      // Update order status
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.REFUNDED,
          adminNotes: `Refund processed: ${charge.amount_refunded / 100} EUR`,
        },
      });

      this.logger.log(`Order ${order.id} marked as refunded`);

      // TODO: Send refund confirmation email
      // await this.emailService.sendRefundConfirmation(order);
    } catch (error) {
      this.logger.error('Error handling charge refund:', error);
    }
  }
}
