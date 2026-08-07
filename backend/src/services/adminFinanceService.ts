import { prisma } from '../lib/db';
import { DebtStatus } from '@prisma/client';

const ACTIVE_DEBT_STATUSES: DebtStatus[] = [
  'ACTIVE',
  'PARTIALLY_PAID',
  'OVERDUE',
  'CRITICAL',
  'DISPUTED',
];

/**
 * Vue d'ensemble financière de la plateforme.
 * Consommé par l'onglet "Vue d'ensemble" de /dashboard/admin/payments.
 */
export async function getAdminFinanceOverview() {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    rev30,
    fees30,
    txTotal,
    txPending,
    escActive,
    escTotalHeld,
    escDisputed,
    debtActive,
    debtOwed,
    debtOverdue,
    highRisk,
    blacklisted,
  ] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED', paidAt: { gte: since30d } },
    }),
    prisma.escrow.aggregate({
      _sum: { fee: true },
      where: { status: 'RELEASED', releasedAt: { gte: since30d } },
    }),
    prisma.payment.count(),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.escrow.count({ where: { status: 'HELD' } }),
    prisma.escrow.aggregate({ _sum: { amount: true }, where: { status: 'HELD' } }),
    prisma.escrow.count({ where: { status: 'DISPUTED' } }),
    prisma.debt.count({ where: { status: { in: ACTIVE_DEBT_STATUSES } } }),
    prisma.debt.aggregate({
      _sum: { remainingAmount: true },
      where: { status: { in: ACTIVE_DEBT_STATUSES } },
    }),
    prisma.debt.count({ where: { status: { in: ['OVERDUE', 'CRITICAL'] } } }),
    prisma.fraudEvent.count({ where: { severity: { in: ['HIGH', 'CRITICAL'] }, blocked: false } }),
    prisma.fraudEvent.count({ where: { action: 'BLOCK', blocked: true } }),
  ]);

  return {
    revenue: {
      total30d: Number(rev30._sum.amount || 0),
      fees30d: Number(fees30._sum.fee || 0),
    },
    transactions: { total: txTotal, pending: txPending },
    escrows: {
      active: escActive,
      totalHeld: Number(escTotalHeld._sum.amount || 0),
      disputes: escDisputed,
    },
    debts: {
      active: debtActive,
      totalOwed: Number(debtOwed._sum?.remainingAmount || 0),
      overdue: debtOverdue,
    },
    risks: { highRisk, blacklisted },
  };
}

/**
 * Liste paginée des transactions (Payment).
 * `status=SUCCESS` est traduit vers l'enum réel `COMPLETED`.
 */
export async function getAdminFinanceTransactions(query: {
  page?: number;
  limit?: number;
  status?: string;
  provider?: string;
}) {
  const page = query.page || 1;
  const limit = query.limit || 15;
  const where: any = {};
  if (query.status) where.status = query.status === 'SUCCESS' ? 'COMPLETED' : query.status;
  if (query.provider) where.method = query.provider;

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { business: { select: { name: true } } },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    transactions: items.map((p) => ({
      id: p.id,
      createdAt: p.createdAt,
      businessName: p.business?.name || null,
      amount: Number(p.amount),
      provider: p.method,
      fee: 0,
      status: p.status === 'COMPLETED' ? 'SUCCESS' : p.status,
      providerRef: p.reference,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Liste paginée des escrows pour l'onglet "Escrows" du dashboard finance.
 */
export async function getAdminFinanceEscrows(query: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const page = query.page || 1;
  const limit = query.limit || 15;
  const where: any = {};
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.escrow.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { business: { select: { name: true } } },
    }),
    prisma.escrow.count({ where }),
  ]);

  return {
    escrows: items.map((e) => ({
      id: e.id,
      createdAt: e.createdAt,
      businessName: e.business?.name || null,
      amount: Number(e.amount),
      status: e.status,
      disputeReason: e.disputeReason,
      releasedAt: e.releasedAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Alertes de fraude non traitées (événements de détection non bloqués).
 * Consommé par l'onglet "Alertes fraude" du dashboard finance.
 */
export async function getAdminFinanceFraudAlerts() {
  const events = await prisma.fraudEvent.findMany({
    where: { blocked: false },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });

  const metadataAmount = (metadata: unknown): number | undefined => {
    try {
      const raw = (metadata as any)?.amount;
      if (typeof raw === 'number' || typeof raw === 'string') return Number(raw);
      return undefined;
    } catch {
      return undefined;
    }
  };

  return {
    alerts: events.map((ev) => ({
      id: ev.id,
      type: ev.eventType,
      severity: ev.severity,
      reason: ev.ruleName,
      client: ev.user
        ? {
            id: ev.user.id,
            firstName: ev.user.firstName,
            lastName: ev.user.lastName,
            email: ev.user.email,
          }
        : null,
      amount: metadataAmount(ev.metadata),
      createdAt: ev.createdAt,
      ipAddress: ev.ipAddress,
    })),
    total: events.length,
  };
}

/**
 * Statistiques de recouvrement des dettes.
 * Consommé par l'onglet "Recouvrement" du dashboard finance.
 */
export async function getAdminFinanceDebtRecovery() {
  const [totalDebts, settledDebts, activeSum, paidSum, topDebtors] = await Promise.all([
    prisma.debt.count({ where: { deletedAt: null } }),
    prisma.debt.count({ where: { status: 'SETTLED' } }),
    prisma.debt.aggregate({
      _sum: { remainingAmount: true },
      where: { status: { in: ACTIVE_DEBT_STATUSES } },
    }),
    prisma.debt.aggregate({ _sum: { amountPaid: true } }),
    prisma.debt.groupBy({
      by: ['buyerId'],
      where: { buyerId: { not: null } },
      _sum: { remainingAmount: true },
      orderBy: { _sum: { remainingAmount: 'desc' } },
      take: 5,
    }),
  ]);

  const recovered = Number(paidSum._sum?.amountPaid || 0);
  const remaining = Number(activeSum._sum?.remainingAmount || 0);
  const totalRecoverable = recovered + remaining;

  return {
    totalDebts,
    settledDebts,
    totalDebtAmount: remaining,
    recoveredAmount: recovered,
    recoveryRate: totalRecoverable > 0 ? Math.round((recovered / totalRecoverable) * 100) : 0,
    topDebtors: topDebtors.filter((t) => t.buyerId),
  };
}
