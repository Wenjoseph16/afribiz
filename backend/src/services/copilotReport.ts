import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

interface WeeklyReport {
  businessId: string;
  businessName: string;
  weekStart: string;
  weekEnd: string;
  stats: {
    orders: number;
    orderChange: number;
    revenue: number;
    revenueChange: number;
    newClients: number;
    clientChange: number;
    reviews: number;
    reviewChange: number;
    pageViews: number;
    viewsChange: number;
  };
  tipsFollowed: number;
  topTip: string;
  healthScore: number;
  healthChange: number;
  actionItems: string[];
  insight: string;
}

export async function generateWeeklyReport(businessId: string): Promise<WeeklyReport | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true, score: true },
  });
  if (!business) return null;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekStart);

  // Current week stats
  const [orders, revenue, newClients, reviews, pageViews] = await Promise.all([
    prisma.order.count({ where: { businessId, createdAt: { gte: weekStart, lt: weekEnd } } }),
    prisma.order.aggregate({
      where: { businessId, createdAt: { gte: weekStart, lt: weekEnd } },
      _sum: { totalAmount: true },
    }),
    prisma.businessDailyStats.aggregate({
      where: { businessId, date: { gte: weekStart, lt: weekEnd } },
      _sum: { newClients: true },
    }),
    prisma.businessReview.count({
      where: { businessId, createdAt: { gte: weekStart, lt: weekEnd } },
    }),
    prisma.businessPageView.count({
      where: { businessId, viewedAt: { gte: weekStart, lt: weekEnd } },
    }),
  ]);

  // Previous week stats
  const [prevOrders, prevRevenue, prevClients, prevReviews, prevViews] = await Promise.all([
    prisma.order.count({
      where: { businessId, createdAt: { gte: prevWeekStart, lt: prevWeekEnd } },
    }),
    prisma.order.aggregate({
      where: { businessId, createdAt: { gte: prevWeekStart, lt: prevWeekEnd } },
      _sum: { totalAmount: true },
    }),
    prisma.businessDailyStats.aggregate({
      where: { businessId, date: { gte: prevWeekStart, lt: prevWeekEnd } },
      _sum: { newClients: true },
    }),
    prisma.businessReview.count({
      where: { businessId, createdAt: { gte: prevWeekStart, lt: prevWeekEnd } },
    }),
    prisma.businessPageView.count({
      where: { businessId, viewedAt: { gte: prevWeekStart, lt: prevWeekEnd } },
    }),
  ]);

  const calcChange = (curr: number, prev: number) =>
    prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

  const tipsFollowed = 0;

  // Health score (use existing service or estimate)
  const prevScore = business.score?.overallScore || 0;
  const healthScore = Math.round(prevScore / 10);
  const healthChange = 0; // We'd need historical tracking

  // Action items
  const lowStock = await prisma.product.findMany({
    where: { businessId, deletedAt: null, stock: { lte: 5 } },
    take: 3,
    select: { name: true },
  });

  const pendingOrders = await prisma.order.count({
    where: { businessId, status: { in: ['PENDING', 'CONFIRMED'] } },
  });

  const actionItems: string[] = [];
  if (pendingOrders > 0) actionItems.push(`${pendingOrders} commande(s) en attente de traitement`);
  if (lowStock.length > 0)
    actionItems.push(`Stock bas : ${lowStock.map((p) => p.name).join(', ')}`);
  if (reviews > 0) actionItems.push(`${reviews} nouvel(aux) avis — répondez-y pour fidéliser`);

  // Weekly insight
  let insight = '';
  if (orders > prevOrders) {
    insight = `📈 Belle semaine ! Vos commandes ont augmenté de ${calcChange(orders, prevOrders)}% par rapport à la semaine dernière. Continuez sur cette lancée !`;
  } else if (orders < prevOrders) {
    insight = `📉 Vos commandes sont en baisse de ${Math.abs(calcChange(orders, prevOrders))}% cette semaine. Essayez une promotion pour relancer l'activité.`;
  } else {
    insight = `📊 Semaine stable avec ${orders} commande(s). Pour progresser, pensez à enrichir votre catalogue.`;
  }

  return {
    businessId,
    businessName: business.name,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    stats: {
      orders,
      orderChange: calcChange(orders, prevOrders),
      revenue: Number(revenue._sum.totalAmount || 0),
      revenueChange: calcChange(
        Number(revenue._sum.totalAmount || 0),
        Number(prevRevenue._sum.totalAmount || 0)
      ),
      newClients: newClients._sum.newClients || 0,
      clientChange: calcChange(newClients._sum.newClients || 0, prevClients._sum.newClients || 0),
      reviews,
      reviewChange: calcChange(reviews, prevReviews),
      pageViews,
      viewsChange: calcChange(pageViews, prevViews),
    },
    tipsFollowed,
    topTip:
      lowStock.length > 0
        ? `Réapprovisionnez ${lowStock[0].name}`
        : orders === 0
          ? 'Créez votre première promotion'
          : 'Maintenez le cap !',
    healthScore,
    healthChange,
    actionItems,
    insight,
  };
}

export async function generateAllWeeklyReports(): Promise<number> {
  const businesses = await prisma.business.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true },
  });

  let count = 0;
  for (const b of businesses) {
    try {
      const report = await generateWeeklyReport(b.id);
      if (report) {
        await prisma.notification.create({
          data: {
            userId: (await prisma.business.findUnique({
              where: { id: b.id },
              select: { ownerId: true },
            }))!.ownerId,
            type: 'SYSTEM',
            title: '📊 Votre rapport hebdomadaire AfriBiz',
            description: `Cette semaine : ${report.stats.orders} commandes, ${report.stats.newClients} nouveaux clients. ${report.insight}`,
            link: '/dashboard',
            metadata: {
              businessId: b.id,
              source: 'copilot-weekly-report',
              weekStart: report.weekStart,
            },
          },
        });
        count++;
      }
    } catch (err) {
      logger.error(`Weekly report failed for business ${b.id}:`, err);
    }
  }

  logger.info(`Weekly reports sent: ${count}/${businesses.length}`);
  return count;
}
