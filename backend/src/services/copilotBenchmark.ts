import { prisma } from '../lib/db';

interface BenchmarkMetric {
  metric: string;
  label: string;
  businessValue: number;
  peerAvg: number;
  difference: number;
  direction: 'above' | 'below' | 'equal';
  unit: string;
}

interface BenchmarkResult {
  businessId: string;
  businessName: string;
  peerCount: number;
  benchmarks: BenchmarkMetric[];
}

export async function getPeerBenchmarks(
  businessId: string,
  businessType: string,
  address?: string
): Promise<BenchmarkResult> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true },
  });
  if (!business) return { businessId, businessName: '', peerCount: 0, benchmarks: [] };

  const peers = await prisma.business.findMany({
    where: {
      id: { not: businessId },
      type: businessType as any,
      isActive: true,
      deletedAt: null,
      ...(address ? { address: { contains: address.split(',')[0] } } : {}),
    },
    select: { id: true, name: true, score: true },
    take: 50,
  });

  if (peers.length === 0) {
    const fallbackPeers = await prisma.business.findMany({
      where: { id: { not: businessId }, isActive: true, deletedAt: null },
      select: { id: true, name: true, score: true },
      take: 50,
    });
    const mb = await getMetrics(businessId);
    const fb = await getAggregateMetrics(fallbackPeers.map((p) => p.id));
    return buildResult(business.name, businessId, mb, fb, fallbackPeers.length);
  }

  const myMetrics = await getMetrics(businessId);
  const peerMetrics = await getAggregateMetrics(peers.map((p) => p.id));

  return buildResult(business.name, businessId, myMetrics, peerMetrics, peers.length);
}

async function getMetrics(businessId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [orders, reviews, pageViews, products, bookings] = await Promise.all([
    prisma.order.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.businessReview.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.businessPageView.count({ where: { businessId, viewedAt: { gte: thirtyDaysAgo } } }),
    prisma.product.count({ where: { businessId, deletedAt: null, isActive: true } }),
    prisma.booking.count({
      where: { providerId: businessId, createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  return { orders, reviews, pageViews, products, bookings };
}

async function getAggregateMetrics(peerIds: string[]) {
  if (peerIds.length === 0)
    return { orders: 0, reviews: 0, pageViews: 0, products: 0, bookings: 0 };

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [orders, reviews, pageViews, products, bookings] = await Promise.all([
    prisma.order.count({
      where: { businessId: { in: peerIds }, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.businessReview.count({
      where: { businessId: { in: peerIds }, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.businessPageView.count({
      where: { businessId: { in: peerIds }, viewedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.product.count({
      where: { businessId: { in: peerIds }, deletedAt: null, isActive: true },
    }),
    prisma.booking.count({
      where: { providerId: { in: peerIds }, createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  const count = peerIds.length || 1;
  return {
    orders: Math.round(orders / count),
    reviews: Math.round(reviews / count),
    pageViews: Math.round(pageViews / count),
    products: Math.round(products / count),
    bookings: Math.round(bookings / count),
  };
}

function buildResult(
  name: string,
  id: string,
  mine: any,
  peers: any,
  count: number
): BenchmarkResult {
  const benchmarks: BenchmarkMetric[] = [];

  const metrics = [
    { key: 'orders', label: 'Commandes (30j)', unit: 'cmd' },
    { key: 'reviews', label: 'Avis (30j)', unit: 'avis' },
    { key: 'pageViews', label: 'Pages vues (30j)', unit: 'vues' },
    { key: 'products', label: 'Produits actifs', unit: 'prod' },
    { key: 'bookings', label: 'Réservations (30j)', unit: 'résa' },
  ];

  for (const m of metrics) {
    const bv = mine[m.key] || 0;
    const pv = peers[m.key] || 0;
    const diff = bv - pv;
    const direction = diff > 0 ? 'above' : diff < 0 ? 'below' : 'equal';

    benchmarks.push({
      metric: m.key,
      label: m.label,
      businessValue: bv,
      peerAvg: pv,
      difference: diff,
      direction,
      unit: m.unit,
    });
  }

  return {
    businessId: id,
    businessName: name,
    peerCount: count,
    benchmarks,
  };
}
