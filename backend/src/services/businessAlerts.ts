import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

/**
 * ============================================
 * BUSINESS ALERT QUEUE — file d'alertes actionnables
 * ============================================
 * Le pendant business de getAdminAlertQueue : agrège en une requête les
 * situations qui demandent l'action du gérant (commandes en attente,
 * réservations à confirmer, stock faible, avis non répondus, dettes,
 * livraisons en cours, factures en attente).
 *
 * Garanties :
 * - Non-bloquant : chaque comptage est isolé, une erreur ne casse pas la file.
 * - Les alertes avec count > 0 sont seules retournées (zéro bruit).
 * - Chaque alerte porte un lien direct vers l'écran d'action.
 */

export type BusinessAlert = {
  key: string;
  label: string;
  count: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  link: string;
};

export async function getBusinessAlertQueue(businessId: string) {
  const now = new Date();
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Chaque comptage est isolé : une erreur sur un modèle ne casse pas la file
  const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      logger.warn('business alert queue count failed', {
        error: (e as Error).message,
      });
      return fallback;
    }
  };

  const [
    pendingOrders,
    pendingBookings,
    lowStockCount,
    unansweredReviews,
    activeDebts,
    overdueDebts,
    activeDeliveries,
    unpaidInvoices,
    expiringPromotions,
    satisfaction,
  ] = await Promise.all([
    safe(
      () =>
        prisma.order.count({
          where: { businessId, status: 'PENDING' },
        }),
      0
    ),
    safe(
      () =>
        prisma.booking.count({
          where: { businessId, status: 'PENDING' },
        }),
      0
    ),
    safe(
      () =>
        prisma.product.count({
          where: {
            businessId,
            isActive: true,
            deletedAt: null,
            lowStockThreshold: { gt: 0 },
            stock: { lte: prisma.product.fields.lowStockThreshold },
          },
        }),
      0
    ),
    safe(
      () =>
        prisma.businessReview.count({
          where: { businessId, response: null, isActive: true },
        }),
      0
    ),
    safe(
      () =>
        prisma.debt.count({
          where: { businessId, status: { in: ['ACTIVE', 'PARTIALLY_PAID'] } },
        }),
      0
    ),
    safe(
      () =>
        prisma.debt.count({
          where: { businessId, status: { in: ['OVERDUE', 'CRITICAL'] } },
        }),
      0
    ),
    safe(
      () =>
        prisma.delivery.count({
          where: {
            businessId,
            status: { in: ['PREPARING', 'ASSIGNED', 'IN_TRANSIT'] },
          },
        }),
      0
    ),
    safe(
      () =>
        prisma.invoice.count({
          where: { businessId, status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] } },
        }),
      0
    ),
    safe(
      () =>
        prisma.promotion.count({
          where: { businessId, isActive: true, endsAt: { gte: now, lte: in7d } },
        }),
      0
    ),
    // Satisfaction : moyenne des enquêtes (30j) + retours négatifs récents (7j)
    // Les retours négatifs couvrent les DEUX sources : enquêtes ≤ 2★ et avis
    // publics ≤ 2★ (un avis public négatif est un signal de réputation fort).
    safe(
      async () => {
        const [agg, surveyLow, reviewLow] = await Promise.all([
          prisma.satisfactionSurveyResponse.aggregate({
            where: { businessId, createdAt: { gte: since30d } },
            _avg: { score: true },
            _count: { _all: true },
          }),
          prisma.satisfactionSurveyResponse.count({
            where: { businessId, createdAt: { gte: since7d }, score: { lte: 2 } },
          }),
          prisma.businessReview.count({
            where: { businessId, isActive: true, createdAt: { gte: since7d }, rating: { lte: 2 } },
          }),
        ]);
        return {
          avg: agg._avg.score ?? null,
          total: agg._count._all || 0,
          recentLow: surveyLow + reviewLow,
        };
      },
      { avg: null, total: 0, recentLow: 0 }
    ),
  ]);

  const alerts: BusinessAlert[] = [];
  const push = (
    key: string,
    label: string,
    count: number,
    severity: BusinessAlert['severity'],
    link: string
  ) => {
    if (count > 0) alerts.push({ key, label, count, severity, link });
  };

  push(
    'pending-orders',
    'Commandes en attente',
    pendingOrders,
    pendingOrders > 5 ? 'CRITICAL' : 'HIGH',
    '/dashboard/orders'
  );
  push(
    'pending-bookings',
    'Réservations à confirmer',
    pendingBookings,
    pendingBookings > 5 ? 'HIGH' : 'MEDIUM',
    '/dashboard/bookings'
  );
  push(
    'low-stock',
    'Produits en stock faible',
    lowStockCount,
    lowStockCount > 5 ? 'HIGH' : 'MEDIUM',
    '/dashboard/products'
  );
  push(
    'unanswered-reviews',
    'Avis sans réponse',
    unansweredReviews,
    'MEDIUM',
    '/dashboard/reviews'
  );
  push(
    'active-debts',
    'Dettes clients actives',
    activeDebts,
    'MEDIUM',
    '/dashboard/debts-payments'
  );
  push('overdue-debts', 'Dettes en retard', overdueDebts, 'CRITICAL', '/dashboard/debts-payments');
  push(
    'active-deliveries',
    'Livraisons en cours',
    activeDeliveries,
    'MEDIUM',
    '/dashboard/deliveries'
  );
  push(
    'unpaid-invoices',
    'Factures en attente de paiement',
    unpaidInvoices,
    'MEDIUM',
    '/dashboard/invoices'
  );
  push(
    'expiring-promotions',
    'Promotions qui expirent sous 7 jours',
    expiringPromotions,
    'LOW',
    '/dashboard/promotions'
  );

  // Réputation : une moyenne < 3 est un signal fort de mécontentement ; un avis
  // récent ≤ 2 étoiles demande une réponse rapide (le client est encore chaud).
  if (satisfaction.avg !== null && satisfaction.avg < 3) {
    push(
      'satisfaction-declining',
      `Satisfaction en baisse (${satisfaction.avg.toLocaleString('fr-FR')}/5)`,
      1,
      'HIGH',
      '/dashboard/crm'
    );
  }
  if (satisfaction.recentLow > 0) {
    push(
      'satisfaction-negative',
      'Retours récents négatifs (avis + enquêtes)',
      satisfaction.recentLow,
      'MEDIUM',
      '/dashboard/crm'
    );
  }

  const urgent = alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
  return { alerts, total: alerts.length, urgent, generatedAt: now, since7d, in7d };
}
