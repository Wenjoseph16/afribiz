import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { publishSurveyResponded } from '../events/publishers';
import { trackAnalyticsEvent } from './analyticsService';

/**
 * Enregistre la réponse à l'enquête de satisfaction (note 1-5 + commentaire),
 * notifie le business (le propriétaire reçoit la réponse) et trace l'événement.
 * La réponse est rattachée à la commande ou à la réservation quand c'est fourni.
 */
export async function submitSatisfaction(
  userId: string,
  data: { orderId?: string; bookingId?: string; score: number; feedback?: string }
) {
  // Garde explicite : une note absente/NaN ne doit JAMAIS devenir 1 silencieusement
  const raw = Number(data.score);
  if (!Number.isFinite(raw) || raw < 1 || raw > 5) throw new AppError('Note invalide (1 à 5)', 400);
  const score = Math.round(raw);

  let businessId: string | null = null;
  if (data.orderId) {
    const order = await prisma.order.findFirst({
      where: { id: data.orderId, buyerId: userId },
      select: { businessId: true },
    });
    if (!order) throw new AppError('Commande non trouvée', 404);
    businessId = order.businessId || null;
  } else if (data.bookingId) {
    const booking = await prisma.booking.findFirst({
      where: { id: data.bookingId, clientId: userId },
      select: { businessId: true },
    });
    if (!booking) throw new AppError('Réservation non trouvée', 404);
    businessId = booking.businessId || null;
  }

  const response = await prisma.satisfactionSurveyResponse.create({
    data: {
      userId,
      businessId,
      orderId: data.orderId || null,
      bookingId: data.bookingId || null,
      score,
      feedback: data.feedback?.trim() ? data.feedback.trim().slice(0, 2000) : null,
    },
  });

  // Notifier le propriétaire du business : il reçoit la réponse de l'enquête
  if (businessId) {
    try {
      const biz = await prisma.business.findUnique({
        where: { id: businessId },
        select: { ownerId: true },
      });
      if (biz?.ownerId) {
        publishSurveyResponded({
          userId: biz.ownerId,
          score,
          feedback: data.feedback?.trim() || undefined,
          orderId: data.orderId || undefined,
        });
      }
    } catch (err) {
      // Notification non bloquante
      console.warn('[satisfaction] owner notify failed:', (err as Error).message);
    }
  }

  trackAnalyticsEvent({
    businessId: businessId || undefined,
    userId,
    type: 'satisfaction',
    category: 'customer',
    eventName: 'SATISFACTION_SUBMITTED',
    value: score,
    properties: { orderId: data.orderId || null, bookingId: data.bookingId || null, feedback: data.feedback?.trim() || null },
  }).catch(() => {});

  return response;
}

/**
 * Statistiques de satisfaction agrégées pour un business (cockpit + CRM).
 * - moyenne + compteur de réponses
 * - distribution des notes 1 à 5
 * - tendance sur 30 jours (moyenne + volume par jour)
 * - derniers retours avec le nom du client
 * Accessible au propriétaire du business (résolu via ownerId).
 */
export async function getBusinessSatisfactionStats(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const where = { businessId: business.id };

  const [aggregate, distribution, recent, recent30] = await Promise.all([
    prisma.satisfactionSurveyResponse.aggregate({
      where,
      _avg: { score: true },
      _count: { _all: true },
    }),
    prisma.satisfactionSurveyResponse.groupBy({
      by: ['score'],
      where,
      _count: { _all: true },
      orderBy: { score: 'asc' },
    }),
    prisma.satisfactionSurveyResponse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        score: true,
        feedback: true,
        createdAt: true,
        orderId: true,
        bookingId: true,
        userId: true,
      },
    }),
    prisma.satisfactionSurveyResponse.findMany({
      where: { ...where, createdAt: { gte: since30 } },
      select: { score: true, createdAt: true },
    }),
  ]);

  // Tendance : regroupement par jour en JS (Prisma ne groupBy pas sur DateTime)
  const byDay = new Map<string, { count: number; sum: number }>();
  for (const r of recent30) {
    const day = r.createdAt.toISOString().slice(0, 10);
    const bucket = byDay.get(day) || { count: 0, sum: 0 };
    bucket.count += 1;
    bucket.sum += r.score;
    byDay.set(day, bucket);
  }
  // Tendance : fenêtre complète de 30 jours (jours sans réponse = 0) pour que
  // le graphique affiche une vraie tendance, pas juste les jours où il y a des notes.
  const trend = [] as { date: string; count: number; average: number }[];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const b = byDay.get(date);
    trend.push({
      date,
      count: b?.count || 0,
      average: b ? Math.round((b.sum / b.count) * 10) / 10 : 0,
    });
  }

  // Noms des clients (le modèle n'a pas de relation user — requête séparée)
  const userIds = [...new Set(recent.map((r) => r.userId).filter(Boolean))];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const totalCount = aggregate._count._all || 0;
  return {
    businessId: business.id,
    businessName: business.name,
    averageScore: totalCount ? Math.round(((aggregate._avg.score || 0) * 10)) / 10 : null,
    totalResponses: totalCount,
    distribution: [5, 4, 3, 2, 1].map((score) => ({
      score,
      count: distribution.find((d) => d.score === score)?._count._all || 0,
    })),
    trend,
    recent: recent.map((r) => {
      const u = userMap.get(r.userId);
      return {
        id: r.id,
        score: r.score,
        feedback: r.feedback,
        createdAt: r.createdAt,
        kind: r.orderId ? 'order' : r.bookingId ? 'booking' : 'other',
        clientName: u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Client' : 'Client',
      };
    }),
  };
}

/**
 * Contexte affiché sur la page d'enquête (nom du commerce, article, référence)
 * pour que le client sache ce qu'il évalue. Accès limité au client concerné.
 */
export async function getSatisfactionContext(
  userId: string,
  orderId?: string,
  bookingId?: string
) {
  if (orderId) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId: userId },
      select: {
        orderNumber: true,
        items: { select: { name: true }, take: 1 },
        business: { select: { name: true, slug: true } },
      },
    });
    if (!order) throw new AppError('Commande non trouvée', 404);
    return {
      kind: 'order' as const,
      businessName: order.business?.name || null,
      businessSlug: order.business?.slug || null,
      itemName: order.items?.[0]?.name || null,
      reference: order.orderNumber,
    };
  }
  if (bookingId) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, clientId: userId },
      select: {
        bookingNumber: true,
        title: true,
        business: { select: { name: true, slug: true } },
      },
    });
    if (!booking) throw new AppError('Réservation non trouvée', 404);
    return {
      kind: 'booking' as const,
      businessName: booking.business?.name || null,
      businessSlug: booking.business?.slug || null,
      itemName: booking.title || null,
      reference: booking.bookingNumber,
    };
  }
  throw new AppError('Référence manquante (commande ou réservation)', 400);
}
