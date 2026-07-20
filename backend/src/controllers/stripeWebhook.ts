import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { config } from '../config/env';

async function getStripeClient() {
  try {
    const stripeModule = await import('stripe');
    if (config.STRIPE_SECRET_KEY) {
      const Stripe = (stripeModule as Record<string, any>).Stripe;
      return new Stripe(config.STRIPE_SECRET_KEY, {
        apiVersion: '2025-02-24.acacia',
      });
    }
    return null;
  } catch {
    return null;
  }
}

export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    const stripe = await getStripeClient();
    if (!stripe) {
      logger.warn('Stripe webhook: Stripe non configuré');
      res.status(503).json({ received: false, error: 'Stripe non configuré' });
      return;
    }

    const sig = req.headers['stripe-signature'] as string;

    let event: any;
    try {
      if (config.STRIPE_WEBHOOK_SECRET) {
        event = stripe.webhooks.constructEvent(req.body, sig, config.STRIPE_WEBHOOK_SECRET);
      } else {
        event = req.body;
      }
    } catch (err: any) {
      logger.warn('Stripe webhook: signature verification failed', { error: err.message });
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    logger.info('Stripe webhook received: ' + event.type, { id: event.id });

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const providerRef = paymentIntent.id;
        await updateTransactionStatus(providerRef, 'SUCCESS');
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const providerRef = paymentIntent.id;
        await updateTransactionStatus(providerRef, 'FAILED');
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        const providerRef = charge.payment_intent;
        if (providerRef) {
          await updateTransactionStatus(providerRef, 'REFUNDED');
        }
        break;
      }
      default:
        logger.info('Stripe webhook: unhandled event ' + event.type);
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    logger.error('Stripe webhook error', { error: err.message });
    res.status(500).json({ received: false, error: err.message });
  }
}

async function updateTransactionStatus(providerRef: string, newStatus: string) {
  const transaction = await prisma.paymentTransaction.findFirst({
    where: { providerRef },
  });

  if (!transaction) {
    logger.warn('Stripe webhook: no transaction for ref ' + providerRef);
    return;
  }

  const updateData: any = { status: newStatus };
  if (newStatus === 'SUCCESS') updateData.paidAt = new Date();

  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: updateData,
  });

  logger.info('Stripe webhook: transaction ' + transaction.id + ' updated to ' + newStatus);

  if (transaction.orderId) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { orderId: transaction.orderId },
      });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: newStatus === 'SUCCESS' ? 'COMPLETED' : 'FAILED',
            paidAt: newStatus === 'SUCCESS' ? new Date() : undefined,
          },
        });
      }
    } catch (e) {
      logger.error('Stripe webhook: failed to update payment', { error: e });
    }
  }
}
