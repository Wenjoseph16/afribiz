import { prisma } from '../lib/db';
import { notificationRepository } from '../repositories/notificationRepository';
import { NotificationType } from '@prisma/client';
import { logger } from '../lib/logger';

const NOTIFICATION_TYPE = NotificationType.SYSTEM;
const FORTY_EIGHT_H_AGO = () => new Date(Date.now() - 48 * 60 * 60 * 1000);
const TODAY_START = () => new Date(new Date().setHours(0, 0, 0, 0));
const SEVEN_DAYS_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

// ──────────────────────────────────────────────
// ATTENTION CENTER
// ──────────────────────────────────────────────

interface AttentionItem {
  id: string;
  type:
    | 'ORDER_DELAYED'
    | 'BOOKING_PENDING'
    | 'QUOTE_PENDING'
    | 'MESSAGE_UNREAD'
    | 'PAYMENT_PENDING'
    | 'DISPUTE_OPEN'
    | 'DELIVERY_DELAYED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  label: string;
  description: string;
  link: string;
  createdAt: Date;
  score: number;
  metadata?: Record<string, unknown>;
}

export async function getAttentionItems(businessId: string): Promise<{
  items: AttentionItem[];
  criticalCount: number;
  highCount: number;
  totalCount: number;
}> {
  const items: AttentionItem[] = [];

  const fortyEightHAgo = FORTY_EIGHT_H_AGO();
  const todayStart = TODAY_START();

  // 1. Orders delayed (>48h still PENDING)
  const delayedOrders = await prisma.order.findMany({
    where: { businessId, status: 'PENDING', createdAt: { lte: fortyEightHAgo } },
    select: { id: true, orderNumber: true, totalAmount: true, createdAt: true, contactName: true },
    orderBy: { createdAt: 'asc' },
  });
  for (const o of delayedOrders) {
    const hoursElapsed = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 3600000);
    items.push({
      id: `order-${o.id}`,
      type: 'ORDER_DELAYED',
      severity: hoursElapsed > 72 ? 'CRITICAL' : 'HIGH',
      label: `Commande #${o.orderNumber} en retard`,
      description: `En attente depuis ${hoursElapsed}h (${o.contactName || 'client inconnu'}) — ${Number(o.totalAmount).toLocaleString()} FCFA`,
      link: `/dashboard/orders/${o.id}`,
      createdAt: o.createdAt,
      score: hoursElapsed * 10 + (hoursElapsed > 72 ? 500 : 0),
      metadata: { orderNumber: o.orderNumber, hoursElapsed, amount: Number(o.totalAmount) },
    });
  }

  // 2. Bookings pending confirmation (>24h)
  const pendingBookings = await prisma.booking.findMany({
    where: { businessId, status: 'PENDING', startDate: { gte: todayStart } },
    select: {
      id: true,
      bookingNumber: true,
      title: true,
      startDate: true,
      customerName: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  for (const b of pendingBookings) {
    const hoursElapsed = Math.floor((Date.now() - new Date(b.createdAt).getTime()) / 3600000);
    const isUrgent = hoursElapsed > 24 || new Date(b.startDate).getTime() - Date.now() < 3600000;
    items.push({
      id: `booking-${b.id}`,
      type: 'BOOKING_PENDING',
      severity: isUrgent ? 'HIGH' : 'MEDIUM',
      label: `Réservation #${b.bookingNumber} à confirmer`,
      description: `${b.title || 'Réservation'} — ${b.customerName || 'client inconnu'} — ${new Date(b.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      link: `/dashboard/bookings/${b.id}`,
      createdAt: b.createdAt,
      score: isUrgent ? 300 + hoursElapsed : hoursElapsed * 5,
      metadata: { bookingNumber: b.bookingNumber, startDate: b.startDate.toISOString() },
    });
  }

  // 3. Pending quotes (DRAFT or SENT, not expired, not older than 30 days)
  const pendingQuotes = await prisma.quote.findMany({
    where: {
      businessId,
      status: { in: ['DRAFT', 'SENT' as any] },
      createdAt: { gte: SEVEN_DAYS_AGO() },
    },
    select: {
      id: true,
      quoteNumber: true,
      title: true,
      totalAmount: true,
      status: true,
      clientName: true,
      createdAt: true,
      validUntil: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  for (const q of pendingQuotes) {
    const daysElapsed = Math.floor((Date.now() - new Date(q.createdAt).getTime()) / 86400000);
    const isExpiring = q.validUntil && new Date(q.validUntil).getTime() - Date.now() < 86400000 * 2;
    items.push({
      id: `quote-${q.id}`,
      type: 'QUOTE_PENDING',
      severity: q.status === 'DRAFT' && daysElapsed > 3 ? 'MEDIUM' : isExpiring ? 'HIGH' : 'LOW',
      label: `Devis #${q.quoteNumber} en attente`,
      description: `${q.title} — ${q.clientName || 'client'} — ${Number(q.totalAmount).toLocaleString()} FCFA${q.status === 'DRAFT' ? ' (brouillon)' : ''}${isExpiring ? ' — expire bientôt' : ''}`,
      link: `/dashboard/quotes/${q.id}`,
      createdAt: q.createdAt,
      score: daysElapsed * 8 + (q.status === 'DRAFT' ? 20 : 0) + (isExpiring ? 100 : 0),
      metadata: { quoteNumber: q.quoteNumber, status: q.status, amount: Number(q.totalAmount) },
    });
  }

  // 4. Unread messages
  const ownerId = (
    await prisma.business.findUnique({ where: { id: businessId }, select: { ownerId: true } })
  )?.ownerId;
  if (ownerId) {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { has: ownerId } },
      select: {
        id: true,
        messages: {
          where: { read: false, senderId: { not: ownerId } },
          select: { id: true, content: true, senderId: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    for (const conv of conversations) {
      if (conv.messages.length === 0) continue;
      const msg = conv.messages[0];
      items.push({
        id: `msg-${conv.id}`,
        type: 'MESSAGE_UNREAD',
        severity: 'MEDIUM',
        label: 'Message non lu',
        description: msg.content?.substring(0, 80) || 'Nouveau message',
        link: `/dashboard/messages/${conv.id}`,
        createdAt: msg.createdAt,
        score: 15,
      });
    }
  }

  // 5. Pending payments
  const pendingPayments = await prisma.payment.findMany({
    where: { order: { businessId }, status: 'PENDING' },
    select: { id: true, amount: true, reference: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  for (const p of pendingPayments) {
    const daysElapsed = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86400000);
    items.push({
      id: `payment-${p.id}`,
      type: 'PAYMENT_PENDING',
      severity: daysElapsed > 7 ? 'HIGH' : 'MEDIUM',
      label: 'Paiement en attente',
      description: `${Number(p.amount).toLocaleString()} FCFA — ${p.reference || 'sans référence'} (${daysElapsed}j)`,
      link: `/dashboard/payments/${p.id}`,
      createdAt: p.createdAt,
      score: daysElapsed * 12,
      metadata: { amount: Number(p.amount), reference: p.reference },
    });
  }

  // 6. Open disputes
  const openDisputes = await prisma.dispute.findMany({
    where: { businessId, status: { in: ['OUVERT', 'EN_COURS' as any] } },
    select: { id: true, title: true, priority: true, amount: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  for (const d of openDisputes) {
    const daysElapsed = Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 86400000);
    const severityMap: Record<string, string> = {
      CRITICAL: 'CRITICAL',
      HIGH: 'HIGH',
      MEDIUM: 'MEDIUM',
      LOW: 'LOW',
    };
    items.push({
      id: `dispute-${d.id}`,
      type: 'DISPUTE_OPEN',
      severity: (severityMap[d.priority] || 'MEDIUM') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      label: `Litige: ${d.title}`,
      description: `${d.amount ? Number(d.amount).toLocaleString() + ' FCFA — ' : ''}Ouvert depuis ${daysElapsed}j`,
      link: `/dashboard/disputes/${d.id}`,
      createdAt: d.createdAt,
      score: daysElapsed * 20 + (d.priority === 'CRITICAL' ? 500 : d.priority === 'HIGH' ? 300 : 0),
      metadata: { priority: d.priority, amount: d.amount ? Number(d.amount) : null },
    });
  }

  // Sort by score descending (most urgent first)
  items.sort((a, b) => b.score - a.score);

  const criticalCount = items.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = items.filter((i) => i.severity === 'HIGH').length;

  return { items, criticalCount, highCount, totalCount: items.length };
}

// ──────────────────────────────────────────────
// URGENCY DETECTOR
// ──────────────────────────────────────────────

export async function checkBusinessUrgency(
  businessId: string,
  ownerId: string,
  _businessName: string
): Promise<number> {
  let alertsCreated = 0;

  const todayStart = TODAY_START();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. Detect overload: today's orders/booking vs daily average
  const [ordersToday, orders30d, bookingsToday, bookings30d, employees, absencesToday] =
    await Promise.all([
      prisma.order.count({
        where: { businessId, createdAt: { gte: todayStart }, status: { not: 'CANCELLED' } },
      }),
      prisma.order.count({
        where: { businessId, createdAt: { gte: thirtyDaysAgo }, status: { not: 'CANCELLED' } },
      }),
      prisma.booking.count({
        where: {
          businessId,
          startDate: { gte: todayStart },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
      }),
      prisma.booking.count({
        where: {
          businessId,
          startDate: { gte: thirtyDaysAgo },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
      }),
      prisma.employee.count({ where: { businessId, status: 'ACTIVE' } }),
      prisma.attendance.count({
        where: { businessId, clockIn: { gte: todayStart }, isAbsent: true },
      }),
    ]);

  const avgOrdersDaily = Math.max(1, Math.round(orders30d / 30));
  const avgBookingsDaily = Math.max(1, Math.round(bookings30d / 30));

  // Overload detection: today's volume > 2x average
  if (ordersToday > avgOrdersDaily * 2 && ordersToday >= 5) {
    await notificationRepository.create({
      userId: ownerId,
      type: NOTIFICATION_TYPE,
      title: '🟠 Surcharge de commandes',
      description: `Vous avez ${ordersToday} commandes aujourd'hui (moyenne: ${avgOrdersDaily}). ${employees > 0 && absencesToday > 0 ? `${absencesToday} employé(s) absent(s). ` : ''}Activez le module Planning pour mieux gérer la charge.`,
      link: '/dashboard/planning',
      metadata: {
        businessId,
        source: 'urgency',
        type: 'overload-orders',
        ordersToday,
        avgOrdersDaily,
      },
    });
    alertsCreated++;
  }

  if (bookingsToday > avgBookingsDaily * 2 && bookingsToday >= 3) {
    await notificationRepository.create({
      userId: ownerId,
      type: NOTIFICATION_TYPE,
      title: '🟠 Surcharge de réservations',
      description: `${bookingsToday} réservations aujourd'hui (moyenne: ${avgBookingsDaily}). Vérifiez votre planning pour éviter les doubles réservations.`,
      link: '/dashboard/planning',
      metadata: {
        businessId,
        source: 'urgency',
        type: 'overload-bookings',
        bookingsToday,
        avgBookingsDaily,
      },
    });
    alertsCreated++;
  }

  // 2. Detect delays: deliveries stuck
  const stuckDeliveries = await prisma.delivery.findMany({
    where: {
      businessId,
      status: { in: ['PREPARING', 'ASSIGNED'] },
      createdAt: { lte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    },
    select: { id: true, deliveryNumber: true, status: true, createdAt: true },
  });
  for (const d of stuckDeliveries) {
    const hoursElapsed = Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 3600000);
    if (alertsCreated >= 3) break;
    await notificationRepository.create({
      userId: ownerId,
      type: NOTIFICATION_TYPE,
      title: '🔴 Livraison en retard',
      description: `Livraison #${d.deliveryNumber} en statut "${d.status}" depuis ${hoursElapsed}h. Vérifiez le coursier.`,
      link: `/dashboard/deliveries/${d.id}`,
      metadata: {
        businessId,
        source: 'urgency',
        type: 'delivery-delay',
        deliveryId: d.id,
        hoursElapsed,
      },
    });
    alertsCreated++;
  }

  // 3. Check if attention items have CRITICAL items and no action taken
  const attention = await getAttentionItems(businessId);
  if (attention.criticalCount > 0) {
    const criticalDisputes = attention.items.filter(
      (i) => i.type === 'DISPUTE_OPEN' && i.severity === 'CRITICAL'
    );
    if (criticalDisputes.length > 0 && alertsCreated < 3) {
      await notificationRepository.create({
        userId: ownerId,
        type: NOTIFICATION_TYPE,
        title: '🔴 Litige(s) critique(s) non résolu(s)',
        description: `${criticalDisputes.length} litige(s) critique(s) nécessite(nt) votre attention immédiate.`,
        link: '/dashboard/disputes',
        metadata: {
          businessId,
          source: 'urgency',
          type: 'critical-disputes',
          count: criticalDisputes.length,
        },
      });
      alertsCreated++;
    }
  }

  return alertsCreated;
}

export async function checkAllBusinessesUrgency(): Promise<{
  total: number;
  alertsCreated: number;
  errors: number;
}> {
  let alertsCreated = 0;
  let errors = 0;

  try {
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      select: { id: true, name: true, ownerId: true },
    });

    for (const b of businesses) {
      try {
        const count = await checkBusinessUrgency(b.id, b.ownerId, b.name);
        alertsCreated += count;
      } catch (err) {
        errors++;
        logger.error(`Urgency check failed for ${b.id}`, err);
      }
    }

    logger.info(
      `Urgency check: ${alertsCreated} alerts for ${businesses.length} businesses (${errors} errors)`
    );
  } catch (err) {
    logger.error('Urgency check: failed to fetch businesses', err);
  }

  return { total: 0, alertsCreated, errors };
}
