import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

/**
 * Create a payment intent for an order
 */
export async function createPaymentIntent(params: {
  amount: number;
  currency?: string;
  orderId: string;
  customerEmail: string;
  metadata?: Record<string, string>;
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency || 'eur',
      payment_method_types: ['card', 'sepa_debit', 'sofort'],
      metadata: {
        orderId: params.orderId,
        ...params.metadata,
      },
      receipt_email: params.customerEmail,
      description: `Order ${params.orderId}`,
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe create payment intent error:', error);
    throw error;
  }
}

/**
 * Get payment intent by ID
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Stripe get payment intent error:', error);
    throw error;
  }
}

/**
 * Confirm a payment intent
 */
export async function confirmPaymentIntent(paymentIntentId: string) {
  try {
    return await stripe.paymentIntents.confirm(paymentIntentId);
  } catch (error) {
    console.error('Stripe confirm payment intent error:', error);
    throw error;
  }
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(paymentIntentId: string) {
  try {
    return await stripe.paymentIntents.cancel(paymentIntentId);
  } catch (error) {
    console.error('Stripe cancel payment intent error:', error);
    throw error;
  }
}

/**
 * Create a refund for a payment intent
 */
export async function createRefund(params: {
  paymentIntentId: string;
  amount?: number; // Optional partial refund amount in cents
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}) {
  try {
    return await stripe.refunds.create({
      payment_intent: params.paymentIntentId,
      amount: params.amount,
      reason: params.reason,
    });
  } catch (error) {
    console.error('Stripe create refund error:', error);
    throw error;
  }
}

/**
 * Construct webhook event from request
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook verification error:', error);
    throw error;
  }
}