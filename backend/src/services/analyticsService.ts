import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

/**
 * Service Analytics central.
 *
 * Le modèle `AnalyticsEvent` (restauré en base) reçoit ici TOUS les événements
 * d'activité de la plateforme : commandes, réservations, paiements, avis,
 * favoris, vues de pages publiques, etc.
 *
 * RÈGLE CRITIQUE : `trackAnalyticsEvent` est NON-BLOQUANT. Un échec de tracking
 * ne doit JAMAIS casser le flux métier qui l'a déclenché (on log + on continue).
 */

export interface AnalyticsEventInput {
  businessId?: string;
  userId?: string;
  /** Catégorie métier : order, booking, payment, review, favorite, page_view, social… */
  type: string;
  /** Catégorie d'interaction : commercial, navigation, dashboard, social… */
  category?: string;
  /** Nom lisible de l'événement (ex: ORDER_PLACED, BOOKING_CREATED) */
  eventName: string;
  /** Données contextuelles libres */
  properties?: Record<string, unknown>;
  /** Valeur numérique (montant, note, durée…) */
  value?: number;
}

export async function trackAnalyticsEvent(data: AnalyticsEventInput): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        businessId: data.businessId || null,
        userId: data.userId || null,
        type: data.type,
        category: data.category || null,
        eventName: data.eventName,
        properties: data.properties ? (data.properties as Prisma.InputJsonValue) : undefined,
        value: data.value ?? undefined,
      },
    });
  } catch (err) {
    logger.warn(`[analytics] Échec tracking ${data.eventName} (non-bloquant)`, err);
  }
}

// ============================================================
// HELPERS D'AGRÉGATION (pour les pages dashboard/analytics)
// ============================================================

export interface AnalyticsEventFilter {
  businessId?: string;
  userId?: string;
  type?: string;
  category?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export async function getAnalyticsEvents(params: AnalyticsEventFilter) {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 50, 200);
  const skip = (page - 1) * limit;

  const where: Prisma.AnalyticsEventWhereInput = {};
  if (params.businessId) where.businessId = params.businessId;
  if (params.userId) where.userId = params.userId;
  if (params.type) where.type = params.type;
  if (params.category) where.category = params.category;
  if (params.from || params.to) {
    where.occurredAt = {};
    if (params.from) where.occurredAt.gte = new Date(params.from);
    if (params.to) where.occurredAt.lte = new Date(params.to);
  }
  if (params.search) {
    where.eventName = { contains: params.search, mode: 'insensitive' };
  }

  const [events, total] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.analyticsEvent.count({ where }),
  ]);

  return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** Répartition des événements par type (ex: order, booking, payment) */
export async function getEventBreakdownByType(businessId?: string, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await prisma.analyticsEvent.groupBy({
    by: ['type'],
    where: { ...(businessId ? { businessId } : {}), occurredAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { type: 'desc' } },
  });
  return rows.map((r) => ({ type: r.type, count: r._count._all }));
}

/** Répartition des événements par catégorie d'interaction */
export async function getEventBreakdownByCategory(businessId?: string, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await prisma.analyticsEvent.groupBy({
    by: ['category'],
    where: {
      ...(businessId ? { businessId } : {}),
      category: { not: null },
      occurredAt: { gte: since },
    },
    _count: { _all: true },
    orderBy: { _count: { category: 'desc' } },
  });
  return rows.map((r) => ({ category: r.category, count: r._count._all }));
}

/** Totaux de la période : événements, répartition par type, pic du jour */
export async function getAnalyticsSummary(businessId?: string, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const where = { ...(businessId ? { businessId } : {}), occurredAt: { gte: since } } as any;
  const whereToday = {
    ...(businessId ? { businessId } : {}),
    occurredAt: { gte: todayStart },
  } as any;

  const [total, today, byType, byCategory] = await Promise.all([
    prisma.analyticsEvent.count({ where }),
    prisma.analyticsEvent.count({ where: whereToday }),
    getEventBreakdownByType(businessId, days),
    getEventBreakdownByCategory(businessId, days),
  ]);

  return {
    total,
    today,
    byType,
    byCategory,
    days,
  };
}

/** Types d'événements dont la valeur est un MONTANT monétaire (FCFA). */
const MONEY_TYPES = ['order', 'payment', 'booking'];

/**
 * Compteurs agrégés pour le dashboard business (depuis AnalyticsEvent).
 * Complète `dataHubAnalytics` (qui agrège les tables métier directement).
 */
export async function getBusinessAnalyticsCounters(businessId: string, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Agrégation en base (pas de chargement mémoire) : counts par type + somme des valeurs
  // NB : `revenue` ne somme QUE les types monétaires (ordre/paiment/réservation) —
  // les valeurs non-monétaires (notes d'avis, etc.) ne sont jamais mélangées dedans.
  const [byType, revenueAgg] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ['type'],
      where: { businessId, occurredAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { type: 'desc' } },
    }),
    prisma.analyticsEvent.aggregate({
      where: { businessId, type: { in: MONEY_TYPES }, occurredAt: { gte: since } },
      _sum: { value: true },
    }),
  ]);

  const totals: Record<string, number> = {};
  let eventCount = 0;
  for (const row of byType) {
    totals[row.type] = row._count._all;
    eventCount += row._count._all;
  }

  return {
    period: days,
    totals,
    revenue: Number(revenueAgg._sum.value) || 0,
    eventCount,
  };
}
