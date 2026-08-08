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
