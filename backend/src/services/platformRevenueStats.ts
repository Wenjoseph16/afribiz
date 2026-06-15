import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';

export interface PlatformRevenueStats {
  totalRevenue: number;
  transactionCommissions: number;
  escrowCommissions: number;
  developerModuleCommissions: number;
  subscriptionRevenue: number;
  adRevenue: number;
  totalBusinesses: number;
  totalTransactions: number;
  totalEscrows: number;
  monthlyBreakdown: { month: string; revenue: number; type: string }[];
  topBusinesses: { id: string; name: string; revenue: number; transactions: number }[];
  dailyStats: { date: string; transactions: number; escrows: number; revenue: number }[];
}

/**
 * Calcule les statistiques de revenus de la plateforme à partir des FinancialLogs
 */
export async function getPlatformRevenueStats(
  period: '7d' | '30d' | '90d' | '1y' | 'all' = '30d'
): Promise<PlatformRevenueStats> {
  const now = new Date();
  let dateFrom: Date | undefined;
  switch (period) {
    case '7d': dateFrom = new Date(now.getTime() - 7 * 86400000); break;
    case '30d': dateFrom = new Date(now.getTime() - 30 * 86400000); break;
    case '90d': dateFrom = new Date(now.getTime() - 90 * 86400000); break;
    case '1y': dateFrom = new Date(now.getTime() - 365 * 86400000); break;
    default: dateFrom = undefined;
  }

  const dateFilter = dateFrom ? { createdAt: { gte: dateFrom } } : {};

  // FinancialLogs avec commission dans les métadonnées
  const commissionLogs = await prisma.financialLog.findMany({
    where: {
      action: 'MANUAL_ADJUSTMENT',
      ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),
      metadata: { path: ['commissionType'], not: Prisma.JsonNull },
    },
    orderBy: { createdAt: 'desc' },
    take: 2000,
  });

  let transactionCommissions = 0;
  let escrowCommissions = 0;
  let developerModuleCommissions = 0;

  for (const log of commissionLogs) {
    const meta = log.metadata as any;
    const amount = Math.abs(Number(log.amount || 0));
    if (meta?.commissionType === 'TRANSACTION_FEE' || meta?.commissionType === 'VERIFIED_PAYMENT_FEE') {
      transactionCommissions += amount;
    } else if (meta?.commissionType === 'ESCROW_FEE') {
      escrowCommissions += amount;
    } else {
      developerModuleCommissions += amount;
    }
  }

  // Revenus des abonnements (via partnerSubscription)
  const subAgg = await prisma.partnerSubscription.aggregate({
    _sum: { price: true },
    where: { status: 'ACTIVE', ...dateFilter },
  });

  // Revenus publicitaires
  const adAgg = await prisma.adCampaign.aggregate({
    _sum: { budget: true },
    where: { status: 'ACTIVE', ...dateFilter },
  });

  // Compteurs
  const [totalBusinesses, totalTransactions, totalEscrows] = await Promise.all([
    prisma.business.count({ where: { isActive: true } }),
    prisma.paymentTransaction.count({ where: { status: 'SUCCESS', ...dateFilter } }),
    prisma.escrow.count({ where: { status: { in: ['RELEASED', 'HELD'] }, ...dateFilter } }),
  ]);

  const totalRevenue = transactionCommissions + escrowCommissions + developerModuleCommissions +
    Number(subAgg._sum.price || 0) + Number(adAgg._sum.budget || 0);

  // Répartition mensuelle
  const monthlyLogs = await prisma.financialLog.findMany({
    where: {
      action: 'MANUAL_ADJUSTMENT',
      ...dateFilter,
      metadata: { path: ['commissionType'], not: Prisma.JsonNull },
    },
    select: { createdAt: true, amount: true, metadata: true },
    orderBy: { createdAt: 'asc' },
  });

  const monthlyMap: Record<string, { transactions: number; escrows: number; modules: number }> = {};
  for (const log of monthlyLogs) {
    const month = log.createdAt.toISOString().slice(0, 7); // YYYY-MM
    if (!monthlyMap[month]) monthlyMap[month] = { transactions: 0, escrows: 0, modules: 0 };
    const meta = log.metadata as any;
    const amount = Math.abs(Number(log.amount || 0));
    if (meta?.commissionType === 'TRANSACTION_FEE' || meta?.commissionType === 'VERIFIED_PAYMENT_FEE') {
      monthlyMap[month].transactions += amount;
    } else if (meta?.commissionType === 'ESCROW_FEE') {
      monthlyMap[month].escrows += amount;
    } else {
      monthlyMap[month].modules += amount;
    }
  }

  const monthlyBreakdown: { month: string; revenue: number; type: string }[] = [];
  for (const [month, values] of Object.entries(monthlyMap)) {
    if (values.transactions > 0) monthlyBreakdown.push({ month, revenue: Math.round(values.transactions * 100) / 100, type: 'Transactions' });
    if (values.escrows > 0) monthlyBreakdown.push({ month, revenue: Math.round(values.escrows * 100) / 100, type: 'Escrow' });
    if (values.modules > 0) monthlyBreakdown.push({ month, revenue: Math.round(values.modules * 100) / 100, type: 'Modules' });
  }

  // Top businesses (basé sur les logs de commission)
  const bizIds = [...new Set(commissionLogs.filter(l => l.businessId).map(l => l.businessId))];
  const bizRevenue: Record<string, number> = {};
  const bizTxn: Record<string, number> = {};
  for (const log of commissionLogs) {
    if (!log.businessId) continue;
    bizRevenue[log.businessId] = (bizRevenue[log.businessId] || 0) + Math.abs(Number(log.amount || 0));
    bizTxn[log.businessId] = (bizTxn[log.businessId] || 0) + 1;
  }

  const sortedBizs = Object.entries(bizRevenue)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const topBusinesses: { id: string; name: string; revenue: number; transactions: number }[] = [];
  if (sortedBizs.length > 0) {
    const bizNames = await prisma.business.findMany({
      where: { id: { in: sortedBizs.map(([id]) => id) } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(bizNames.map(b => [b.id, b.name]));
    for (const [id, revenue] of sortedBizs) {
      topBusinesses.push({ id, name: nameMap.get(id) || 'Inconnu', revenue: Math.round(revenue * 100) / 100, transactions: bizTxn[id] || 0 });
    }
  }

  // Stats journalières des 30 derniers jours
  const dailyStats: { date: string; transactions: number; escrows: number; revenue: number }[] = [];
  const dailyFrom = new Date(now.getTime() - 30 * 86400000);
  const dailyTxns = await prisma.paymentTransaction.findMany({
    where: { status: 'SUCCESS', createdAt: { gte: dailyFrom } },
    select: { createdAt: true, amount: true },
  });
  const dailyEscrows = await prisma.escrow.findMany({
    where: { status: 'RELEASED', createdAt: { gte: dailyFrom } },
    select: { createdAt: true, amount: true },
  });

  const dailyMap: Record<string, { transactions: number; escrows: number; revenue: number }> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateKey = d.toISOString().slice(0, 10);
    dailyMap[dateKey] = { transactions: 0, escrows: 0, revenue: 0 };
  }
  for (const txn of dailyTxns) {
    const key = txn.createdAt.toISOString().slice(0, 10);
    if (dailyMap[key]) dailyMap[key].transactions++;
  }
  for (const escrow of dailyEscrows) {
    const key = escrow.createdAt.toISOString().slice(0, 10);
    if (dailyMap[key]) dailyMap[key].escrows++;
  }
  for (const log of commissionLogs) {
    const key = log.createdAt.toISOString().slice(0, 10);
    if (dailyMap[key]) dailyMap[key].revenue += Math.abs(Number(log.amount || 0));
  }

  for (const [date, stats] of Object.entries(dailyMap).sort()) {
    dailyStats.push({ date, ...stats, revenue: Math.round(stats.revenue * 100) / 100 });
  }

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    transactionCommissions: Math.round(transactionCommissions * 100) / 100,
    escrowCommissions: Math.round(escrowCommissions * 100) / 100,
    developerModuleCommissions: Math.round(developerModuleCommissions * 100) / 100,
    subscriptionRevenue: Number(subAgg._sum.price || 0),
    adRevenue: Number(adAgg._sum.budget || 0),
    totalBusinesses,
    totalTransactions,
    totalEscrows,
    monthlyBreakdown,
    topBusinesses,
    dailyStats,
  };
}
