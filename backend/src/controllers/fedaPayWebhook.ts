import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { config } from '../config/env';
import { recordOrderSale } from '../services/cashService';

/**
 * Applique l'événement FedaPay à la transaction (CHEMIN UNIQUE, partagé entre
 * le webhook réel et le simulateur de démo). Une transaction `sim_` confirmée en
 * mode démonstration passe EXACTEMENT par le même code que la production :
 * transaction → paiement → commande → caisse du jour.
 */
export async function applyFedaPayEvent(
  providerRef: string,
  eventType: string
): Promise<{ transaction: any; newStatus: string | null }> {
  let newStatus: string | null = null;
  switch (eventType) {
    case 'transaction.approved':
    case 'transaction.completed':
      newStatus = 'SUCCESS';
      break;
    case 'transaction.cancelled':
    case 'transaction.failed':
      newStatus = 'FAILED';
      break;
    case 'transaction.refunded':
      newStatus = 'REFUNDED';
      break;
    default:
      return { transaction: null, newStatus: null };
  }

  const transaction = await prisma.paymentTransaction.findFirst({ where: { providerRef } });
  if (!transaction) {
    logger.warn('FedaPay: no transaction for ref ' + providerRef);
    return { transaction: null, newStatus };
  }

  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === 'SUCCESS') {
    updateData.paidAt = new Date();
  }

  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: updateData,
  });

  logger.info(`FedaPay: transaction ${transaction.id} updated to ${newStatus}`);

  // Paiement lié à la commande (si transaction.orderId)
  let updatedOrder: any = null;
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

      // Commande : marquée PAID + l'argent entre dans la caisse du jour (Chantier 4)
      if (newStatus === 'SUCCESS') {
        const order = await prisma.order.findUnique({
          where: { id: transaction.orderId },
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            paymentMethod: true,
            businessId: true,
          },
        });
        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'PAID', paidAt: new Date() },
          });
          updatedOrder = order;
        }
      }
    } catch (e) {
      logger.error('FedaPay: failed to update payment/order', { error: e });
    }
  }

  // Abonnement : si la transaction est un paiement de souscription (metadata
  // type=SUBSCRIPTION) et qu'elle est approuvée → activer la souscription
  // (crédit wallet net de commission, idempotent via activateSubscription).
  const meta = (transaction.metadata as any) || {};
  if (
    meta.type === 'SUBSCRIPTION' &&
    meta.subscriptionId &&
    newStatus === 'SUCCESS' &&
    transaction.userId
  ) {
    try {
      const { confirmSubscriptionPaymentByRef } = await import('../services/subscriptions');
      await confirmSubscriptionPaymentByRef(
        transaction.providerRef || providerRef || '',
        transaction.userId
      );
      logger.info('FedaPay: subscription ' + meta.subscriptionId + ' activated');
    } catch (e) {
      logger.error('FedaPay: failed to activate subscription', { error: e });
    }
  }

  return { transaction, newStatus };
}

export async function handleFedaPayWebhook(req: Request, res: Response) {
  try {
    // FedaPay HMAC validation — OBLIGATOIRE en production
    if (!config.FEDAPAY_WEBHOOK_SECRET) {
      logger.error('FedaPay webhook: FEDAPAY_WEBHOOK_SECRET non configuré');
      if (config.NODE_ENV === 'production') {
        res.status(500).json({ error: 'Webhook secret not configured' });
        return;
      }
    } else {
      const signature = req.headers['x-fedapay-signature'] as string;
      if (!signature) {
        logger.warn('FedaPay webhook: signature manquante');
        res.status(401).json({ error: 'Missing signature' });
        return;
      }
      const payload = JSON.stringify(req.body);
      const expectedSig = crypto
        .createHmac('sha256', config.FEDAPAY_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
      const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
      if (!valid) {
        logger.warn('FedaPay webhook: signature invalide');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }

    const event = req.body;
    const eventType = event.type || event.event_type;
    const data = event.data || event.object || {};
    logger.info('FedaPay webhook received: ' + eventType, { transactionId: data.id });

    const providerRef = data.id || data.transaction?.id;
    if (!providerRef) {
      logger.warn('FedaPay webhook: no transaction ID');
      res.status(200).json({ received: true });
      return;
    }

    await applyFedaPayEvent(providerRef, eventType);

    res.status(200).json({ received: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('FedaPay webhook error', { error: errorMessage });
    res.status(200).json({ received: true, error: errorMessage });
  }
}
