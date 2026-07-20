import { prisma } from '../lib/db';

interface Anomaly {
  metric: string;
  label: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  direction: 'up' | 'down';
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

interface AnomalyResult {
  businessId: string;
  generatedAt: string;
  anomalies: Anomaly[];
}

export async function detectAnomalies(businessId: string): Promise<AnomalyResult> {
  const now = new Date();
  const currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  const metrics: Array<{
    key: string;
    label: string;
    current: Promise<number>;
    previous: Promise<number>;
  }> = [
    {
      key: 'orders',
      label: 'Commandes',
      current: prisma.order.count({
        where: { businessId, createdAt: { gte: currentStart } },
      }),
      previous: prisma.order.count({
        where: { businessId, createdAt: { gte: previousStart, lt: currentStart } },
      }),
    },
    {
      key: 'reviews',
      label: 'Avis clients',
      current: prisma.businessReview.count({
        where: { businessId, createdAt: { gte: currentStart } },
      }),
      previous: prisma.businessReview.count({
        where: { businessId, createdAt: { gte: previousStart, lt: currentStart } },
      }),
    },
    {
      key: 'pageViews',
      label: 'Pages vues',
      current: prisma.businessPageView.count({
        where: { businessId, viewedAt: { gte: currentStart } },
      }),
      previous: prisma.businessPageView.count({
        where: { businessId, viewedAt: { gte: previousStart, lt: currentStart } },
      }),
    },
    {
      key: 'bookings',
      label: 'Réservations',
      current: prisma.booking.count({
        where: { providerId: businessId, createdAt: { gte: currentStart } },
      }),
      previous: prisma.booking.count({
        where: { providerId: businessId, createdAt: { gte: previousStart, lt: currentStart } },
      }),
    },
  ];

  const results = await Promise.all(
    metrics.map(async (m) => {
      const currentValue = await m.current;
      const previousValue = await m.previous;
      return { ...m, currentValue, previousValue };
    })
  );

  const anomalies: Anomaly[] = [];

  for (const r of results) {
    if (r.currentValue === 0 && r.previousValue === 0) continue;

    const changePercent =
      r.previousValue === 0
        ? 100
        : Math.round(((r.currentValue - r.previousValue) / r.previousValue) * 100);

    const absChange = Math.abs(changePercent);
    if (absChange < 30) continue;

    const direction = changePercent > 0 ? 'up' : 'down';

    let severity: 'info' | 'warning' | 'critical';
    let message: string;

    if (direction === 'down') {
      if (absChange >= 60) {
        severity = 'critical';
        message = `Chute importante de vos ${r.label.toLowerCase()} : -${absChange}% (${r.previousValue} → ${r.currentValue})`;
      } else {
        severity = 'warning';
        message = `Baisse de vos ${r.label.toLowerCase()} : -${absChange}% (${r.previousValue} → ${r.currentValue})`;
      }
    } else {
      if (absChange >= 60) {
        severity = 'info';
        message = `Forte hausse de vos ${r.label.toLowerCase()} : +${absChange}% (${r.previousValue} → ${r.currentValue})`;
      } else {
        severity = 'info';
        message = `Hausse de vos ${r.label.toLowerCase()} : +${absChange}% (${r.previousValue} → ${r.currentValue})`;
      }
    }

    anomalies.push({
      metric: r.key,
      label: r.label,
      currentValue: r.currentValue,
      previousValue: r.previousValue,
      changePercent,
      direction,
      severity,
      message,
    });
  }

  return {
    businessId,
    generatedAt: new Date().toISOString(),
    anomalies,
  };
}
