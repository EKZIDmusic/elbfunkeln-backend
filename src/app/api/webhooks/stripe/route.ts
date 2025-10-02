import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { constructWebhookEvent } from '@/lib/stripe';
import Stripe from 'stripe';

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers(); // ✅ await hinzugefügt
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No stripe signature' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature, webhookSecret);
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error('No orderId in payment intent metadata');
      return;
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'COMPLETED',
        status: 'PROCESSING',
        paymentIntentId: paymentIntent.id,
      },
    });

    console.log(`Order ${orderId} payment succeeded`);

    // TODO: Send confirmation email
    // TODO: Trigger fulfillment process
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error('No orderId in payment intent metadata');
      return;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'FAILED',
      },
    });

    console.log(`Order ${orderId} payment failed`);

    // TODO: Send payment failed email
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Handle canceled payment
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error('No orderId in payment intent metadata');
      return;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED',
      },
    });

    console.log(`Order ${orderId} payment canceled`);
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

/**
 * Handle refund
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      console.error('No payment_intent in charge');
      return;
    }

    // Find order by payment intent
    const order = await prisma.order.findFirst({
      where: { paymentIntentId },
    });

    if (!order) {
      console.error(`No order found for payment intent ${paymentIntentId}`);
      return;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'REFUNDED',
      },
    });

    console.log(`Order ${order.id} refunded`);

    // TODO: Send refund confirmation email
  } catch (error) {
    console.error('Error handling refund:', error);
  }
}