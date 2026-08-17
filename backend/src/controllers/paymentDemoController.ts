import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { isPaymentDemoMode } from '../services/paymentProcessor';
import { applyFedaPayEvent } from './fedaPayWebhook';
import { recordOrderSale } from '../services/cashService';
import { logger } from '../lib/logger';

/**
 * Confirmation de paiement en MODE DÉMONSTRATION.
 *
 * Sans clé API FedaPay, un paiement initié reste `PENDING` (comme dans la vraie
 * vie : on attend la confirmation sur le téléphone). Cet endpoint joue le rôle
 * de la confirmation mobile ET du webhook FedaPay : il rejoue le CHEMIN DE CODE
 * DE PRODUCTION (`applyFedaPayEvent`) pour marquer la transaction SUCCESS, puis
 * fait entrer l'argent dans la caisse du jour (même traçage que le webhook réel).
 *
 * Sécurité : refusé hors mode démo, et uniquement pour les transactions SIMULÉES
 * appartenant à l'utilisateur connecté.
 */
export const demoConfirmPayment = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    if (!isPaymentDemoMode()) {
      throw new AppError('Mode démonstration désactivé', 403);
    }

    const { providerRef } = req.body;
    if (!providerRef) throw new AppError('providerRef requis', 400);

    // Uniquement les transactions simulées (préfixe sim_) — jamais une vraie
    // transaction FedaPay en production.
    if (!String(providerRef).startsWith('sim_')) {
      throw new AppError('Seules les transactions de démonstration (sim_) sont confirmables ici', 403);
    }

    const transaction = await prisma.paymentTransaction.findFirst({
      where: { providerRef, userId: req.user.id },
    });
    if (!transaction) throw new AppError('Transaction non trouvée', 404);

    if (transaction.status === 'SUCCESS') {
      return res.json({
        success: true,
        data: { transaction, alreadyConfirmed: true, message: 'Paiement déjà confirmé.' },
      });
    }

    // Chemin de production : transaction → paiement → commande → caisse du jour
    const { transaction: updated, newStatus } = await applyFedaPayEvent(
      providerRef,
      'transaction.approved'
    );

    if (newStatus === 'SUCCESS' && transaction.orderId) {
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
        // L'argent entre dans la caisse du jour du business (idempotent par montant)
        const owner = await prisma.business.findUnique({
          where: { id: order.businessId || '' },
          select: { ownerId: true },
        });
        if (owner?.ownerId) {
          await recordOrderSale(
            owner.ownerId,
            {
              id: order.id,
              number: order.orderNumber,
              totalAmount: Number(order.totalAmount || 0),
              paymentMethod: order.paymentMethod,
              businessId: order.businessId,
            },
            Number(order.totalAmount || 0),
            req.user.id
          ).catch((e: any) =>
            logger.warn(`Démo: trace caisse non créée (${order.id}): ${e?.message || e}`)
          );
        }
      }
    }

    res.json({
      success: true,
      data: {
        transaction: updated,
        status: newStatus,
        message: 'Paiement confirmé (mode démonstration) — le webhook FedaPay a été simulé.',
      },
    });
  }
);

/** Liste les transactions simulées de l'utilisateur (pour l'UI de démo). */
export const demoListTransactions = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);

    const transactions = await prisma.paymentTransaction.findMany({
      where: { userId: req.user.id, providerRef: { startsWith: 'sim_' } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ success: true, data: { transactions } });
  }
);
