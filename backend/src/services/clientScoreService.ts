import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

export async function computeClientScore(clientId: string, businessId: string) {
  const [orders, bookings, payments, reviews] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId: clientId, businessId },
      select: { id: true, totalAmount: true, status: true, createdAt: true },
    }),
    prisma.booking.findMany({
      where: { clientId, businessId },
      select: { id: true, status: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { userId: clientId, businessId, status: 'COMPLETED' },
      select: { id: true, amount: true },
    }),
    prisma.review.findMany({
      where: { userId: clientId },
      select: { id: true, rating: true },
    }),
  ]);

  const orderCount = orders.length;
  const bookingCount = bookings.length;
  const totalSpent = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const completedOrders = orders.filter(
    (o) => o.status === 'DELIVERED' || o.status === 'COMPLETED'
  ).length;
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').length;
  const avgRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const reliability = orderCount > 0 ? (completedOrders / orderCount) * 0.25 : 0;
  const bookingReliability = bookingCount > 0 ? (completedBookings / bookingCount) * 0.1 : 0;
  const frequency = Math.min(orderCount / 20, 1) * 0.2;
  const spending = Math.min(totalSpent / 1000000, 1) * 0.15;
  const satisfaction = (avgRating / 5) * 0.15;
  const recency = calculateRecencyScore(orders, bookings);

  const score = Math.round(
    (reliability + bookingReliability + frequency + spending + satisfaction + recency) * 100
  );
  const category =
    score >= 80 ? 'VIP' : score >= 60 ? 'FIDÈLE' : score >= 40 ? 'RÉGULIER' : 'NOUVEAU';

  return { clientId, businessId, score, category, totalSpent, orderCount, bookingCount };
}

function calculateRecencyScore(
  orders: { createdAt: Date }[],
  bookings: { createdAt: Date }[]
): number {
  const all = [...orders, ...bookings].map((i) => new Date(i.createdAt).getTime());
  if (all.length === 0) return 0;
  const latest = Math.max(...all);
  const daysSince = (Date.now() - latest) / 86400000;
  if (daysSince <= 7) return 0.15;
  if (daysSince <= 30) return 0.1;
  if (daysSince <= 90) return 0.05;
  return 0;
}

export async function recomputeClientScoresForBusiness(businessId: string) {
  const clients = await prisma.order.findMany({
    where: { businessId },
    select: { buyerId: true },
    distinct: ['buyerId'],
  });
  for (const c of clients) {
    if (!c.buyerId) continue;
    try {
      await computeClientScore(c.buyerId, businessId);
    } catch (err) {
      logger.error(`Failed to compute client score for ${c.buyerId}:`, err);
    }
  }
}
