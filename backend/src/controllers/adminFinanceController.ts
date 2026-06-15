import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { prisma } from '../lib/db';

function getDateRange(months: number) {
  return { gte: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000) };
}

export const getAdminFinanceOverview = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.roles?.includes('ADMIN')) throw new AppError('Accès refusé', 403);

  const thirtyDays = getDateRange(1);

  const [
    totalTransactions, pendingTransactions, totalRevenue, platformFees,
    activeEscrows, escrowAmount, disputedEscrows,
    activeDebts, debtAmount, overdueDebts,
    highRiskClients, blacklistedClients,
  ] = await Promise.all([
    prisma.paymentTransaction.count(),
    prisma.paymentTransaction.count({ where: { status: 'PENDING' } }),
    prisma.paymentTransaction.aggregate({ where: { status: 'SUCCESS', createdAt: thirtyDays }, _sum: { amount: true } }),
    prisma.paymentTransaction.aggregate({ where: { status: 'SUCCESS', createdAt: thirtyDays }, _sum: { fee: true } }),
    prisma.escrow.count({ where: { status: 'HELD' } }),
    prisma.escrow.aggregate({ where: { status: 'HELD' }, _sum: { amount: true } }),
    prisma.escrow.count({ where: { status: 'DISPUTED' } }),
    prisma.debt.count({ where: { status: { in: ['ACTIVE', 'PARTIALLY_PAID', 'OVERDUE'] } } }),
    prisma.debt.aggregate({ where: { status: { in: ['ACTIVE', 'PARTIALLY_PAID', 'OVERDUE'] } }, _sum: { remainingAmount: true } }),
    prisma.debt.count({ where: { status: 'OVERDUE' } }),
    prisma.clientRisk.count({ where: { riskLevel: { in: ['HIGH', 'CRITICAL'] } } }),
    prisma.clientRisk.count({ where: { blacklisted: true } }),
  ]);

  res.json({ success: true, data: {
    transactions: { total: totalTransactions, pending: pendingTransactions },
    revenue: { total30d: Number(totalRevenue._sum.amount || 0), fees30d: Number(platformFees._sum.fee || 0) },
    escrows: { active: activeEscrows, totalHeld: Number(escrowAmount._sum.amount || 0), disputes: disputedEscrows },
    debts: { active: activeDebts, totalOwed: Number(debtAmount._sum.remainingAmount || 0), overdue: overdueDebts },
    risks: { highRisk: highRiskClients, blacklisted: blacklistedClients },
  }});
});

export const getAdminAllTransactions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.roles?.includes('ADMIN')) throw new AppError('Accès refusé', 403);
  const { page = '1', limit = '20', status, provider } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
  const where: any = {};
  if (status) where.status = status;
  if (provider) where.provider = provider;

  const [transactions, total] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where, skip: (pageNum - 1) * limitNum, take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: { business: { select: { name: true, ownerId: true } } },
    }),
    prisma.paymentTransaction.count({ where }),
  ]);

  res.json({ success: true, data: {
    transactions: transactions.map(t => ({
      ...t, businessName: (t as any).business?.name || null,
    })),
    total, page: pageNum, limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  }});
});

export const getAdminAllEscrows = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.roles?.includes('ADMIN')) throw new AppError('Accès refusé', 403);
  const { page = '1', limit = '20', status } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
  const where: any = {};
  if (status) where.status = status;

  const [escrows, total] = await Promise.all([
    prisma.escrow.findMany({
      where, skip: (pageNum - 1) * limitNum, take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: { business: { select: { name: true, ownerId: true } } },
    }),
    prisma.escrow.count({ where }),
  ]);

  res.json({ success: true, data: {
    escrows: escrows.map(e => ({ ...e, businessName: (e as any).business?.name || null })),
    total, page: pageNum, limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  }});
});

export const getAdminFraudAlerts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.roles?.includes('ADMIN')) throw new AppError('Accès refusé', 403);

  const alerts: any[] = [];

  // 1. Clients blacklistés
  const blacklisted = await prisma.clientRisk.findMany({
    where: { blacklisted: true },
    include: { client: { select: { firstName: true, lastName: true, email: true, phone: true } } },
    take: 20,
  });
  for (const b of blacklisted) {
    alerts.push({
      type: 'BLACKLISTED_CLIENT',
      severity: 'HIGH',
      client: b.client,
      reason: 'Client blacklisté',
      createdAt: b.updatedAt,
    });
  }

  // 2. Clients avec risque CRITICAL
  const criticalRisks = await prisma.clientRisk.findMany({
    where: { riskLevel: 'CRITICAL', blacklisted: false },
    include: { client: { select: { firstName: true, lastName: true, email: true } } },
    take: 20,
  });
  for (const r of criticalRisks) {
    alerts.push({
      type: 'CRITICAL_RISK',
      severity: 'MEDIUM',
      client: r.client,
      reason: 'Score risque critique - ' + r.latePaymentCount + ' impayés',
      createdAt: r.updatedAt,
    });
  }

  // 3. Escrows en litige
  const disputedEscrows = await prisma.escrow.findMany({
    where: { status: 'DISPUTED' },
    include: { business: { select: { name: true } } },
    take: 20,
  });
  for (const e of disputedEscrows) {
    alerts.push({
      type: 'ESCROW_DISPUTE',
      severity: 'HIGH',
      escrowId: e.id,
      businessName: (e as any).business?.name,
      reason: e.disputeReason || 'Litige escrow',
      amount: Number(e.amount),
      createdAt: e.disputedAt || e.updatedAt,
    });
  }

  // 4. Paiements en verification depuis + de 48h
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const pendingVerification = await prisma.payment.findMany({
    where: { status: 'VERIFYING' as any, createdAt: { lte: twoDaysAgo } },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    take: 20,
  });
  for (const p of pendingVerification) {
    alerts.push({
      type: 'PENDING_VERIFICATION',
      severity: 'LOW',
      user: p.user,
      paymentId: p.id,
      amount: Number(p.amount),
      reason: 'Paiement en attente de vérification depuis +48h',
      createdAt: p.createdAt,
    });
  }

  alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, data: { alerts: alerts.slice(0, 50), total: alerts.length } });
});

export const getAdminDebtRecovery = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.roles?.includes('ADMIN')) throw new AppError('Accès refusé', 403);

  const [totalDebts, settledDebts, totalAmount, recoveredAmount, topDebtors] = await Promise.all([
    prisma.debt.count(),
    prisma.debt.count({ where: { status: 'SETTLED' } }),
    prisma.debt.aggregate({ _sum: { totalAmount: true } }),
    prisma.debt.aggregate({ where: { status: 'SETTLED' }, _sum: { amountPaid: true } }),
    prisma.debt.groupBy({
      by: ['buyerId'],
      _sum: { remainingAmount: true },
      orderBy: { _sum: { remainingAmount: 'desc' } },
      take: 10,
    }),
  ]);

  const recoveryRate = Number(totalAmount._sum.totalAmount || 0) > 0
    ? Math.round((Number(recoveredAmount._sum.amountPaid || 0) / Number(totalAmount._sum.totalAmount || 1)) * 100)
    : 0;

  res.json({ success: true, data: {
    totalDebts,
    settledDebts,
    totalDebtAmount: Number(totalAmount._sum.totalAmount || 0),
    recoveredAmount: Number(recoveredAmount._sum.amountPaid || 0),
    recoveryRate,
    topDebtors,
  }});
});
