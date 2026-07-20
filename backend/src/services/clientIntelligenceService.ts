import { prisma } from '../lib/db';

const SEVEN_DAYS_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const NINETY_DAYS_AGO = () => new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

// ──────────────────────────────────────────────
// CLIENT SEGMENTATION (Partie 9)
// ──────────────────────────────────────────────

interface ClientSegmentInfo {
  clientId: string;
  businessClientId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: Date | null;
  lastVisitAt: Date | null;
  visitCount: number;
  segment: 'VIP' | 'LOYAL' | 'ACTIVE' | 'INACTIVE' | 'LOST' | 'AT_RISK';
  fidelityScore: number;
  suggestion: string;
}

export async function segmentClients(businessId: string): Promise<{
  clients: ClientSegmentInfo[];
  counts: Record<string, number>;
  suggestions: { segment: string; message: string; action: string; link: string }[];
}> {
  const ninetyDaysAgo = NINETY_DAYS_AGO();

  const businessClients = await prisma.businessClient.findMany({
    where: { businessId, isActive: true, isBlacklisted: false },
    select: {
      id: true,
      clientId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      totalOrders: true,
      totalSpent: true,
      lastOrderAt: true,
      lastVisitAt: true,
      visitCount: true,
    },
    orderBy: { totalSpent: 'desc' },
  });

  // Calculate top 10% threshold for VIP
  const sortedBySpent = [...businessClients].sort(
    (a, b) => Number(b.totalSpent) - Number(a.totalSpent)
  );
  const top10PctIndex = Math.max(1, Math.floor(sortedBySpent.length * 0.1));
  const vipThreshold = sortedBySpent[top10PctIndex - 1]?.totalSpent || 0;

  const counts: Record<string, number> = {
    VIP: 0,
    LOYAL: 0,
    ACTIVE: 0,
    INACTIVE: 0,
    LOST: 0,
    AT_RISK: 0,
  };
  const segmented: ClientSegmentInfo[] = [];

  // Batch all 90-day order counts in a single query (fix N+1)
  const orderCounts = await prisma.order.groupBy({
    by: ['buyerId'],
    where: { businessId, buyerId: { not: null }, createdAt: { gte: ninetyDaysAgo } },
    _count: { id: true },
  });
  const orderCountMap = new Map(
    orderCounts.filter((o) => o.buyerId !== null).map((o) => [o.buyerId as string, o._count.id])
  );

  for (const c of businessClients) {
    const totalSpent = Number(c.totalSpent);
    const lastOrder = c.lastOrderAt ? new Date(c.lastOrderAt) : null;
    const lastVisit = c.lastVisitAt ? new Date(c.lastVisitAt) : null;
    const daysSinceOrder = lastOrder
      ? Math.floor((Date.now() - lastOrder.getTime()) / 86400000)
      : 999;
    const orders90d = orderCountMap.get(c.clientId) || 0;

    let segment: ClientSegmentInfo['segment'];
    let fidelityScore: number;
    let suggestion: string;

    if (totalSpent >= Number(vipThreshold) && totalSpent > 0) {
      segment = 'VIP';
      fidelityScore = Math.min(100, Math.round(orders90d * 10 + Number(totalSpent) / 1000));
      suggestion = 'Offrez une remise exclusive ou un accès anticipé aux nouvelles offres.';
    } else if (orders90d >= 3) {
      segment = 'LOYAL';
      fidelityScore = Math.min(90, Math.round(50 + orders90d * 5));
      suggestion = 'Remerciez ce client fidèle avec un coupon de fidélité.';
    } else if (daysSinceOrder <= 30) {
      segment = 'ACTIVE';
      fidelityScore = Math.min(70, Math.round(30 + orders90d * 8));
      suggestion = 'Continuez à engager ce client avec des recommandations personnalisées.';
    } else if (daysSinceOrder <= 90) {
      segment = 'INACTIVE';
      fidelityScore = Math.max(10, 50 - daysSinceOrder);
      suggestion = 'Relancez ce client avec une offre "Nous vous regrettons".';
    } else {
      segment = 'LOST';
      fidelityScore = Math.max(0, 30 - daysSinceOrder);
      suggestion = "Tentez une offre de retour exceptionnelle ou libérez l'espace CRM.";
    }

    // Check if declining
    if (daysSinceOrder <= 90 && orders90d === 0 && c.totalOrders > 0) {
      segment = 'AT_RISK';
      suggestion = 'Ce client commandait avant mais plus depuis 90j. Contactez-le rapidement.';
    }

    counts[segment]++;
    segmented.push({
      clientId: c.clientId,
      businessClientId: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      totalOrders: c.totalOrders,
      totalSpent,
      lastOrderAt: lastOrder,
      lastVisitAt: lastVisit ? new Date(lastVisit) : null,
      visitCount: c.visitCount,
      segment,
      fidelityScore,
      suggestion,
    });
  }

  const suggestions = generateSegmentSuggestions(counts);

  return { clients: segmented, counts, suggestions };
}

function generateSegmentSuggestions(
  counts: Record<string, number>
): { segment: string; message: string; action: string; link: string }[] {
  const s: { segment: string; message: string; action: string; link: string }[] = [];
  if (counts.LOST > 5)
    s.push({
      segment: 'LOST',
      message: `${counts.LOST} clients perdus. Lancez une campagne de réactivation.`,
      action: 'Campagne email',
      link: '/dashboard/marketing',
    });
  if (counts.INACTIVE > 10)
    s.push({
      segment: 'INACTIVE',
      message: `${counts.INACTIVE} clients inactifs (30-90j). Envoyez une offre de retour.`,
      action: 'Voir les clients',
      link: '/dashboard/clients',
    });
  if (counts.AT_RISK > 0)
    s.push({
      segment: 'AT_RISK',
      message: `${counts.AT_RISK} client(s) à risque de départ. Contactez-les.`,
      action: 'Voir les clients',
      link: '/dashboard/clients',
    });
  if (counts.VIP > 0)
    s.push({
      segment: 'VIP',
      message: `${counts.VIP} client(s) VIP. Programme de fidélité ou offres exclusives.`,
      action: 'Programme fidélité',
      link: '/dashboard/loyalty',
    });
  if (counts.LOYAL > 5)
    s.push({
      segment: 'LOYAL',
      message: `${counts.LOYAL} clients fidèles. Récompensez-les avec des points.`,
      action: 'Voir les clients',
      link: '/dashboard/clients',
    });
  return s;
}

// ──────────────────────────────────────────────
// TOP CLIENTS LEADERBOARD (Partie 10)
// ──────────────────────────────────────────────

export async function getTopClients(
  businessId: string,
  period: '7d' | '30d' | '90d' | 'all' = '30d',
  limit = 10
) {
  const dateFilter =
    period === '7d'
      ? SEVEN_DAYS_AGO()
      : period === '30d'
        ? THIRTY_DAYS_AGO()
        : period === '90d'
          ? NINETY_DAYS_AGO()
          : new Date(0);

  const [ordersByClient, businessClients] = await Promise.all([
    prisma.order.groupBy({
      by: ['buyerId'],
      where: { businessId, buyerId: { not: null }, createdAt: { gte: dateFilter } },
      _count: { id: true },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit,
    }),
    prisma.businessClient.findMany({
      where: { businessId },
      select: {
        clientId: true,
        totalOrders: true,
        totalSpent: true,
        lastOrderAt: true,
        visitCount: true,
        firstName: true,
        lastName: true,
      },
    }),
  ]);

  const clientMap = new Map(businessClients.map((c) => [c.clientId, c]));

  const topClients = await Promise.all(
    ordersByClient.map(async (o) => {
      const clientData = clientMap.get(o.buyerId!);
      const user = clientData
        ? null
        : await prisma.user.findUnique({
            where: { id: o.buyerId! },
            select: { id: true, firstName: true, lastName: true, avatar: true },
          });

      return {
        clientId: o.buyerId,
        firstName: clientData?.firstName || user?.firstName || null,
        lastName: clientData?.lastName || user?.lastName || null,
        ordersInPeriod: o._count.id,
        totalSpentInPeriod: Number(o._sum.totalAmount || 0),
        totalOrdersAllTime: clientData?.totalOrders || 0,
        totalSpentAllTime: Number(clientData?.totalSpent || 0),
        lastOrderAt: clientData?.lastOrderAt,
        visitCount: clientData?.visitCount || 0,
        avatar: user?.avatar || null,
      };
    })
  );

  return topClients;
}

// ──────────────────────────────────────────────
// ACTIVITY BAROMETER (Partie 11)
// ──────────────────────────────────────────────

export async function getActivityBarometer(businessId: string) {
  const sevenDaysAgo = SEVEN_DAYS_AGO();
  const thirtyDaysAgo = THIRTY_DAYS_AGO();

  // Most popular product (by orderCount in last 7 days)
  const popularProducts = await prisma.product.findMany({
    where: { businessId, isActive: true, deletedAt: null, orderCount: { gt: 0 } },
    orderBy: { orderCount: 'desc' },
    take: 5,
    select: { id: true, name: true, orderCount: true, images: true, price: true },
  });

  // Most popular service (by bookingCount)
  const popularServices = await prisma.service.findMany({
    where: { businessId, isActive: true, deletedAt: null, bookingCount: { gt: 0 } },
    orderBy: { bookingCount: 'desc' },
    take: 5,
    select: { id: true, name: true, bookingCount: true, images: true, price: true },
  });

  // Peak hour from order data (last 30 days)
  const recentOrders = await prisma.order.findMany({
    where: { businessId, createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  });

  const hourCount: Record<number, number> = {};
  const dayCount: Record<number, number> = {};
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  for (const o of recentOrders) {
    const d = new Date(o.createdAt);
    hourCount[d.getHours()] = (hourCount[d.getHours()] || 0) + 1;
    dayCount[d.getDay()] = (dayCount[d.getDay()] || 0) + 1;
  }

  const peakHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0];
  const peakDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];

  // Trending product: biggest orderCount increase
  const [productsPrev, productsCurrent] = await Promise.all([
    prisma.product.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true, orderCount: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { businessId, createdAt: { gte: sevenDaysAgo } } },
      select: { productId: true, quantity: true },
    }),
  ]);

  const currentCounts: Record<string, number> = {};
  for (const item of productsCurrent) {
    if (!item.productId) continue;
    currentCounts[item.productId] = (currentCounts[item.productId] || 0) + item.quantity;
  }

  const trendingProducts = productsPrev
    .map((p) => ({
      id: p.id,
      name: p.name,
      totalOrders: p.orderCount,
      recentOrders: currentCounts[p.id] || 0,
    }))
    .filter((p) => p.recentOrders > 0)
    .sort((a, b) => b.recentOrders - a.recentOrders)
    .slice(0, 5);

  return {
    topProducts: popularProducts.map((p) => ({
      id: p.id,
      name: p.name,
      totalOrders: p.orderCount,
      image: p.images?.[0],
      price: Number(p.price),
    })),
    topServices: popularServices.map((s) => ({
      id: s.id,
      name: s.name,
      totalBookings: s.bookingCount,
      image: s.images?.[0],
      price: Number(s.price),
    })),
    peakHour: peakHour ? { hour: `${peakHour[0]}h`, count: peakHour[1] } : null,
    peakDay: peakDay ? { day: dayNames[Number(peakDay[0])], count: peakDay[1] } : null,
    trendingProducts,
  };
}
