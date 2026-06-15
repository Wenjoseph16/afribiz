import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';
import {
  publishEscrowCreated,
  publishEscrowHeld,
  publishEscrowReleased,
  publishEscrowRefunded,
  publishEscrowDisputed,
  publishDebtCreated,
  publishDebtSettled,
  publishDebtOverdue,
} from '../events/publishers';
import { getOrCreateWallet } from './wallet';
import { calculateCommission } from './monetizationConfig';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true, settings: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  return business;
}

const debtInclude = {
  order: { select: { id: true, orderNumber: true, totalAmount: true } },
  invoice: { select: { id: true, invoiceNumber: true, totalAmount: true } },
  buyer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  reminders: { orderBy: { createdAt: 'desc' } },
} satisfies Prisma.DebtInclude;

// ===================== DEBTS =====================

export async function listDebts(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, status, priority, sourceType, riskLevel, search, dateFrom, dateTo } = filters;
  const where: Prisma.DebtWhereInput = { businessId: business.id };
  if (status) where.status = status as any;
  if (priority) where.priority = priority as any;
  if (sourceType) where.sourceType = sourceType as any;
  if (riskLevel) where.riskLevel = riskLevel as any;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }
  if (search) where.OR = [
    { buyer: { firstName: { contains: search, mode: 'insensitive' } } },
    { buyer: { lastName: { contains: search, mode: 'insensitive' } } },
    { buyer: { phone: { contains: search, mode: 'insensitive' } } },
    { notes: { contains: search, mode: 'insensitive' } },
  ];
  const skip = (page - 1) * limit;
  const [debts, total] = await Promise.all([
    prisma.debt.findMany({ where, include: debtInclude, skip, take: limit, orderBy: { updatedAt: 'desc' } }),
    prisma.debt.count({ where }),
  ]);
  return { debts, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getDebt(ownerId: string, debtId: string) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({ where: { id: debtId, businessId: business.id }, include: debtInclude });
  if (!debt) throw new AppError('Dette non trouvée', 404);
  return debt;
}

export async function updateDebt(ownerId: string, debtId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({ where: { id: debtId, businessId: business.id } });
  if (!debt) throw new AppError('Dette non trouvée', 404);

  const upd: any = {};
  if (data.priority) upd.priority = data.priority;
  if (data.status) upd.status = data.status;
  if (data.riskLevel) upd.riskLevel = data.riskLevel;
  if (data.dueDate) upd.dueDate = new Date(data.dueDate);
  if (data.notes) upd.notes = data.notes;
  if (data.totalAmount) upd.totalAmount = data.totalAmount;

  if (data.status === 'SETTLED') {
    upd.status = 'SETTLED';
    upd.remainingAmount = 0;
    upd.amountPaid = debt.totalAmount;
  }
  if (data.status === 'CANCELLED') {
    upd.status = 'CANCELLED';
  }

  await logFinancialAction(business.id, null, {
    action: 'DEBT_UPDATED',
    entityType: 'DEBT',
    entityId: debtId,
    description: `Dette mise à jour: ${debt.id}`,
    amount: Number(debt.remainingAmount),
    oldValue: { status: debt.status, priority: debt.priority },
    newValue: { status: upd.status || debt.status, priority: upd.priority || debt.priority },
  });

  const updated = await prisma.debt.update({ where: { id: debtId }, data: upd, include: debtInclude });

  if (updated.status === 'SETTLED') {
    publishDebtSettled({
      userId: ownerId,
      debtId,
      businessId: business.id,
      amount: String(updated.totalAmount),
    });
  }

  return updated;
}

export async function registerDebtPayment(ownerId: string, debtId: string, data: { amount: number; paymentMethod?: string; notes?: string; proofUrl?: string }) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({ where: { id: debtId, businessId: business.id } });
  if (!debt) throw new AppError('Dette non trouvée', 404);
  if (debt.status === 'SETTLED' || debt.status === 'CANCELLED') throw new AppError('Dette déjà soldée', 400);

  const newPaid = Number(debt.amountPaid || 0) + Number(data.amount);
  const remaining = Number(debt.totalAmount) - newPaid;
  const upd: any = { amountPaid: newPaid, remainingAmount: Math.max(0, remaining) };

  if (remaining <= 0) { upd.status = 'SETTLED'; }
  else { upd.status = 'PARTIALLY_PAID'; }

  const updated = await prisma.debt.update({ where: { id: debtId }, data: upd, include: debtInclude });

  await logFinancialAction(business.id, debt.buyerId, {
    action: 'PAYMENT_RECEIVED',
    entityType: 'DEBT',
    entityId: debtId,
    description: `Paiement de ${data.amount} reçu sur dette #${debt.id.substring(0,8)}`,
    amount: data.amount,
  });

  if (updated.status === 'SETTLED') {
    publishDebtSettled({
      userId: ownerId,
      debtId,
      businessId: business.id,
      amount: String(debt.totalAmount),
    });
  }

  return updated;
}

export async function listClientDebts(userId: string, filters: any) {
  const { page = 1, limit = 20, status } = filters;
  const where: Prisma.DebtWhereInput = { buyerId: userId };
  if (status) where.status = status as any;
  const skip = (page - 1) * limit;
  const [debts, total] = await Promise.all([
    prisma.debt.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        business: { select: { name: true, logo: true } },
        order: { select: { orderNumber: true, id: true } },
      },
    }),
    prisma.debt.count({ where }),
  ]);
  return {
    debts: debts.map((d) => ({
      ...d,
      businessName: d.business?.name || null,
      reference: d.order?.orderNumber || d.invoiceId || d.id.slice(0, 8),
      progression: Number(d.totalAmount) > 0 ? Math.round((Number(d.amountPaid) / Number(d.totalAmount)) * 100) : 0,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function clientPayDebt(userId: string, debtId: string, data: { amount: number; paymentMethod?: string; notes?: string }) {
  const debt = await prisma.debt.findFirst({ where: { id: debtId, buyerId: userId } });
  if (!debt) throw new AppError('Dette non trouvée', 404);
  if (debt.status === 'SETTLED' || debt.status === 'CANCELLED') throw new AppError('Dette déjà soldée', 400);

  const newPaid = Number(debt.amountPaid || 0) + Number(data.amount);
  const remaining = Number(debt.totalAmount) - newPaid;
  const upd: any = { amountPaid: newPaid, remainingAmount: Math.max(0, remaining) };
  if (remaining <= 0) upd.status = 'SETTLED';
  else upd.status = 'PARTIALLY_PAID';

  const updated = await prisma.debt.update({ where: { id: debtId }, data: upd });

  await logFinancialAction(debt.businessId, userId, {
    action: 'PAYMENT_RECEIVED',
    entityType: 'DEBT',
    entityId: debtId,
    description: `Paiement de ${data.amount} effectué sur dette #${debtId.slice(0, 8)}`,
    amount: data.amount,
  });

  return updated;
}

export async function updateDebtPriority(ownerId: string, debtId: string, priority: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.debt.update({
    where: { id: debtId, businessId: business.id },
    data: { priority: priority as any },
    include: debtInclude,
  });
}

// ===================== ESCROW =====================

export async function createEscrow(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const escrow = await prisma.escrow.create({
    data: {
      businessId: business.id,
      orderId: data.orderId || null,
      invoiceId: data.invoiceId || null,
      amount: data.amount,
      currency: data.currency || business.settings?.currency || 'FCFA',
      status: 'HELD',
      notes: data.notes || null,
    },
  });

  await logFinancialAction(business.id, null, {
    action: 'ESCROW_HELD',
    entityType: 'ESCROW',
    entityId: escrow.id,
    description: `Escrow créé: ${data.amount}`,
    amount: data.amount,
  });

  publishEscrowCreated({
    userId: ownerId,
    escrowId: escrow.id,
    amount: String(escrow.amount),
    orderId: escrow.orderId || undefined,
  });

  return escrow;
}

export async function releaseEscrow(ownerId: string, escrowId: string) {
  const business = await getBusinessByOwner(ownerId);
  const escrow = await prisma.escrow.findFirst({ where: { id: escrowId, businessId: business.id } });
  if (!escrow) throw new AppError('Escrow non trouvé', 404);
  if (escrow.status !== 'HELD') throw new AppError('Escrow non disponible pour libération', 400);

  const { rate: feeRate, commission: fee, netAmount } = await calculateCommission(Number(escrow.amount), 'escrow');

  const updated = await prisma.escrow.update({
    where: { id: escrowId },
    data: { status: 'RELEASED', releasedAt: new Date(), fee, feeRate, netAmount, releasedToWallet: true },
  });

  // Credit the business wallet with the net amount
  await getOrCreateWallet(business.id);
  await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { businessId: business.id } });
    if (wallet) {
      const newBalance = Number(wallet.balance) + netAmount;
      await tx.wallet.update({ where: { businessId: business.id }, data: { balance: newBalance } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'ESCROW_RELEASE',
          amount: netAmount,
          balanceBefore: Number(wallet.balance),
          balanceAfter: newBalance,
          reference: escrowId,
          description: `Libération escrow (${fee} FCFA de frais déduits)`,
        },
      });
    }
  });

  await logFinancialAction(business.id, null, {
    action: 'ESCROW_RELEASED',
    entityType: 'ESCROW',
    entityId: escrowId,
    description: `Escrow libéré: ${escrow.amount} (frais: ${fee})`,
    amount: Number(escrow.amount),
  });

  publishEscrowReleased({
    userId: ownerId,
    escrowId,
    amount: String(escrow.amount),
  });

  return updated;
}

export async function refundEscrow(ownerId: string, escrowId: string, reason?: string) {
  const business = await getBusinessByOwner(ownerId);
  const escrow = await prisma.escrow.findFirst({ where: { id: escrowId, businessId: business.id } });
  if (!escrow) throw new AppError('Escrow non trouvé', 404);
  if (escrow.status !== 'HELD' && escrow.status !== 'DISPUTED') throw new AppError('Escrow non remboursable', 400);

  const updated = await prisma.escrow.update({
    where: { id: escrowId },
    data: { status: 'REFUNDED', refundedAt: new Date(), disputeReason: reason || null },
  });

  await logFinancialAction(business.id, null, {
    action: 'ESCROW_REFUNDED',
    entityType: 'ESCROW',
    entityId: escrowId,
    description: `Escrow remboursé: ${escrow.amount} - ${reason || ''}`,
    amount: Number(escrow.amount),
  });

  publishEscrowRefunded({
    userId: ownerId,
    escrowId,
    amount: String(escrow.amount),
  });

  return updated;
}

export async function disputeEscrow(ownerId: string, escrowId: string, reason: string) {
  const business = await getBusinessByOwner(ownerId);
  const updated = await prisma.escrow.update({
    where: { id: escrowId, businessId: business.id },
    data: { status: 'DISPUTED', disputedAt: new Date(), disputeReason: reason },
  });

  await logFinancialAction(business.id, null, {
    action: 'ESCROW_DISPUTED',
    entityType: 'ESCROW',
    entityId: escrowId,
    description: `Litige escrow: ${reason}`,
  });

  publishEscrowDisputed({
    userId: ownerId,
    escrowId,
    amount: String(updated.amount),
  });

  return updated;
}

export async function listEscrows(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, status } = filters;
  const where: Prisma.EscrowWhereInput = { businessId: business.id };
  if (status) where.status = status as any;
  const skip = (page - 1) * limit;
  const [escrows, total] = await Promise.all([
    prisma.escrow.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.escrow.count({ where }),
  ]);
  return { escrows, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function listClientEscrows(userId: string, filters: any) {
  const { page = 1, limit = 20, status } = filters;
  const where: Prisma.EscrowWhereInput = {
    order: { buyerId: userId },
  };
  if (status) where.status = status as any;
  const skip = (page - 1) * limit;
  const [escrows, total] = await Promise.all([
    prisma.escrow.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        business: { select: { name: true, logo: true } },
        order: { select: { orderNumber: true } },
      },
    }),
    prisma.escrow.count({ where }),
  ]);
  return {
    escrows: escrows.map((e) => ({
      ...e,
      businessName: e.business?.name || null,
      business: e.business?.name || null,
      reference: e.order?.orderNumber || e.id.slice(0, 8),
      montant: e.amount,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function clientReleaseEscrow(userId: string, escrowId: string) {
  const escrow = await prisma.escrow.findFirst({
    where: { id: escrowId, order: { buyerId: userId } },
  });
  if (!escrow) throw new AppError('Escrow non trouvé', 404);
  if (escrow.status !== 'HELD') throw new AppError('Escrow non disponible pour libération', 400);

  const { rate: feeRate, commission: fee, netAmount } = await calculateCommission(Number(escrow.amount), 'escrow');

  const updated = await prisma.escrow.update({
    where: { id: escrowId },
    data: {
      status: 'RELEASED',
      releasedAt: new Date(),
      fee,
      feeRate,
      netAmount,
      releasedToWallet: true,
    },
  });

  // Credit the business wallet with the net amount
  await getOrCreateWallet(escrow.businessId);
  await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { businessId: escrow.businessId } });
    if (wallet) {
      const newBalance = Number(wallet.balance) + netAmount;
      await tx.wallet.update({ where: { businessId: escrow.businessId }, data: { balance: newBalance } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'ESCROW_RELEASE',
          amount: netAmount,
          balanceBefore: Number(wallet.balance),
          balanceAfter: newBalance,
          reference: escrowId,
          description: `Libération escrow client (${fee} FCFA de frais déduits)`,
        },
      });
    }
  });

  await logFinancialAction(escrow.businessId, null, {
    action: 'ESCROW_RELEASED',
    entityType: 'ESCROW',
    entityId: escrowId,
    description: `Escrow libéré par le client: ${escrow.amount} (frais: ${fee})`,
    amount: Number(escrow.amount),
  });

  // Log the platform commission
  if (fee > 0) {
    try {
      await prisma.financialLog.create({
        data: {
          businessId: escrow.businessId,
          action: 'MANUAL_ADJUSTMENT',
          amount: -fee,
          description: `Commission AfriBiz ${(feeRate * 100).toFixed(1)}% sur escrow #${escrowId.slice(0, 8)}`,
          metadata: { commissionType: 'ESCROW_FEE', escrowId, escrowAmount: Number(escrow.amount), fee, feeRate },
        },
      });
    } catch (e) {
      logger.error('Failed to log escrow commission', { error: e });
    }
  }

  publishEscrowReleased({
    userId,
    escrowId,
    amount: String(escrow.amount),
  });

  return updated;
}

export async function clientDisputeEscrow(userId: string, escrowId: string, reason: string) {
  const escrow = await prisma.escrow.findFirst({
    where: { id: escrowId, order: { buyerId: userId } },
  });
  if (!escrow) throw new AppError('Escrow non trouvé', 404);

  const updated = await prisma.escrow.update({
    where: { id: escrowId },
    data: { status: 'DISPUTED', disputedAt: new Date(), disputeReason: reason },
  });

  await logFinancialAction(escrow.businessId, null, {
    action: 'ESCROW_DISPUTED',
    entityType: 'ESCROW',
    entityId: escrowId,
    description: `Litige escrow ouvert par le client: ${reason}`,
  });

  publishEscrowDisputed({
    userId,
    escrowId,
    amount: String(updated.amount),
  });

  return updated;
}

// ===================== CLIENT RISK =====================

export async function getClientRisk(ownerId: string, clientId?: string) {
  const business = await getBusinessByOwner(ownerId);
  if (!clientId) throw new AppError('Spécifiez clientId', 400);

  const where: any = { businessId: business.id, clientId };
  let risk = await prisma.clientRisk.findFirst({ where });
  if (!risk) {
    risk = await prisma.clientRisk.create({
      data: { businessId: business.id, clientId },
    });
  }
  return risk;
}

export async function updateClientRisk(ownerId: string, riskId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const upd: any = {};
  if (data.riskLevel) upd.riskLevel = data.riskLevel;
  if (data.reliabilityScore !== undefined) upd.reliabilityScore = data.reliabilityScore;
  if (data.notes) upd.notes = data.notes;
  if (data.blacklisted !== undefined) { upd.blacklisted = data.blacklisted; }
  if (data.requireDeposit !== undefined) upd.requireDeposit = data.requireDeposit;
  if (data.maxCreditAmount !== undefined) upd.maxCreditAmount = data.maxCreditAmount;

  await logFinancialAction(business.id, null, {
    action: 'RISK_UPDATED',
    entityType: 'CLIENT_RISK',
    entityId: riskId,
    description: `Risque client mis à jour`,
  });

  return prisma.clientRisk.update({ where: { id: riskId, businessId: business.id }, data: upd });
}

export async function listClientRisks(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, riskLevel, blacklisted, search } = filters;
  const where: any = { businessId: business.id };
  if (riskLevel) where.riskLevel = riskLevel;
  if (blacklisted !== undefined) where.blacklisted = blacklisted === 'true';
  if (search) where.OR = [
    { notes: { contains: search, mode: 'insensitive' } },
    { client: { firstName: { contains: search, mode: 'insensitive' } } },
    { client: { lastName: { contains: search, mode: 'insensitive' } } },
    { client: { phone: { contains: search, mode: 'insensitive' } } },
  ];
  const skip = (page - 1) * limit;
  const [risks, total] = await Promise.all([
    prisma.clientRisk.findMany({ where, skip, take: limit, orderBy: { updatedAt: 'desc' } }),
    prisma.clientRisk.count({ where }),
  ]);
  return { risks, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ===================== REMINDERS =====================

export async function sendDebtReminder(ownerId: string, debtId: string, channel: string, content?: string) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({ where: { id: debtId, businessId: business.id } });
  if (!debt) throw new AppError('Dette non trouvée', 404);

  const reminder = await prisma.debtReminder.create({
    data: {
      debtId,
      type: debt.status === 'OVERDUE' ? 'OVERDUE' : 'DUE_DATE',
      channel: channel as any,
      status: 'PENDING',
      content: content || `Rappel: ${debt.remainingAmount} FCFA restants sur votre dette`,
    },
  });

  // Simulate sending (in production: integrate WhatsApp/SMS/Email)
  await prisma.debtReminder.update({
    where: { id: reminder.id },
    data: { status: 'SENT', sentAt: new Date() },
  });

  await prisma.debt.update({
    where: { id: debtId },
    data: {},
  });

  await logFinancialAction(business.id, null, {
    action: 'REMINDER_SENT',
    entityType: 'DEBT',
    entityId: debtId,
    description: `Rappel ${channel} envoyé pour dette #${debt.id.substring(0,8)}`,
  });

  return reminder;
}

export async function listReminders(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, status } = filters;
  const where: any = { debt: { businessId: business.id } };
  if (status) where.status = status;
  const skip = (page - 1) * limit;
  const [reminders, total] = await Promise.all([
    prisma.debtReminder.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { debt: { select: { id: true, totalAmount: true, remainingAmount: true, status: true } } } }),
    prisma.debtReminder.count({ where }),
  ]);
  return { reminders, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ===================== FINANCIAL LOG =====================

async function logFinancialAction(businessId: string, userId: string | null, data: { action: any; entityType: string; entityId?: string; description?: string; amount?: number; oldValue?: any; newValue?: any }) {
  try {
    await prisma.financialLog.create({
      data: {
        businessId,
        userId,
        action: data.action,
        amount: data.amount || null,
        description: data.description || null,
        metadata: {
          entityType: data.entityType,
          entityId: data.entityId || null,
          oldValue: data.oldValue || null,
          newValue: data.newValue || null,
        },
      },
    });
  } catch (e) {
    // Log silently - financial log should never break the main operation
    logger.error('Failed to log financial action', { error: e });
  }
}

export async function listFinancialLogs(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 50, action, entityType, dateFrom, dateTo } = filters;
  const where: any = { businessId: business.id };
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.financialLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.financialLog.count({ where }),
  ]);
  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ===================== STATS =====================

export async function getPaymentStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id };

  const [totalDebts, totalDebtAmount, activeDebts, activeDebtAmount, overdueDebts, settledDebts, criticalDebts, totalPaid] = await Promise.all([
    prisma.debt.count({ where }),
    prisma.debt.aggregate({ where, _sum: { totalAmount: true } }),
    prisma.debt.count({ where: { ...where, status: { in: ['ACTIVE', 'PARTIALLY_PAID'] } } }),
    prisma.debt.aggregate({ where: { ...where, status: { in: ['ACTIVE', 'PARTIALLY_PAID'] } }, _sum: { remainingAmount: true } }),
    prisma.debt.count({ where: { ...where, status: 'OVERDUE' } }),
    prisma.debt.count({ where: { ...where, status: 'SETTLED' } }),
    prisma.debt.count({ where: { ...where, priority: 'CRITICAL', status: { notIn: ['SETTLED', 'CANCELLED'] } } }),
    prisma.debt.aggregate({ where: { ...where, status: 'SETTLED' }, _sum: { amountPaid: true } }),
  ]);

  const [escrowHeld, escrowReleased, highRiskClients] = await Promise.all([
    prisma.escrow.aggregate({ where: { ...where, status: 'HELD' }, _sum: { amount: true } }),
    prisma.escrow.aggregate({ where: { ...where, status: 'RELEASED' }, _sum: { amount: true } }),
    prisma.clientRisk.count({ where: { ...where, riskLevel: { in: ['HIGH', 'CRITICAL'] } } }),
  ]);

  // Recovery rate
  const recoveryRate = totalDebtAmount._sum.totalAmount && Number(totalDebtAmount._sum.totalAmount) > 0
    ? Math.round((Number(totalPaid._sum.amountPaid || 0) / Number(totalDebtAmount._sum.totalAmount)) * 100)
    : 0;

  return {
    totalDebts,
    totalDebtAmount: Number(totalDebtAmount._sum.totalAmount) || 0,
    activeDebts,
    activeDebtAmount: Number(activeDebtAmount._sum.remainingAmount) || 0,
    overdueDebts,
    criticalDebts,
    settledDebts,
    totalRecovered: Number(totalPaid._sum.amountPaid) || 0,
    recoveryRate,
    escrowHeld: Number(escrowHeld._sum.amount) || 0,
    escrowReleased: Number(escrowReleased._sum.amount) || 0,
    highRiskClients,
  };
}
