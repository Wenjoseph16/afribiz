import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';
import * as fedapay from '../lib/fedapay';
import {
  publishEscrowCreated,
  publishEscrowReleased,
  publishEscrowRefunded,
  publishEscrowDisputed,
  publishDebtSettled,
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
  const {
    page = 1,
    limit = 20,
    status,
    priority,
    sourceType,
    riskLevel,
    search,
    dateFrom,
    dateTo,
  } = filters;
  const where: Prisma.DebtWhereInput = { businessId: business.id, deletedAt: null };
  if (status) where.status = status as any;
  if (priority) where.priority = priority as any;
  if (sourceType) where.sourceType = sourceType as any;
  if (riskLevel) where.riskLevel = riskLevel as any;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }
  if (search)
    where.OR = [
      { buyer: { firstName: { contains: search, mode: 'insensitive' } } },
      { buyer: { lastName: { contains: search, mode: 'insensitive' } } },
      { buyer: { phone: { contains: search, mode: 'insensitive' } } },
      { notes: { contains: search, mode: 'insensitive' } },
    ];
  const skip = (page - 1) * limit;
  const [debts, total] = await Promise.all([
    prisma.debt.findMany({
      where,
      include: debtInclude,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.debt.count({ where }),
  ]);
  return { debts, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getDebt(ownerId: string, debtId: string) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({
    where: { id: debtId, businessId: business.id, deletedAt: null },
    include: debtInclude,
  });
  if (!debt) throw new AppError('Dette non trouvée', 404);
  return debt;
}

export async function updateDebt(ownerId: string, debtId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({
    where: { id: debtId, businessId: business.id, deletedAt: null },
  });
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

  const updated = await prisma.debt.update({
    where: { id: debtId },
    data: upd,
    include: debtInclude,
  });

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

export async function deleteDebt(ownerId: string, debtId: string) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({
    where: { id: debtId, businessId: business.id, deletedAt: null },
  });
  if (!debt) throw new AppError('Dette non trouvée', 404);

  // Soft-delete : la dette est masquée des listes mais conservée pour l'historique comptable
  await prisma.debt.update({
    where: { id: debtId },
    data: { deletedAt: new Date(), status: 'CANCELLED' },
  });
  await logFinancialAction(business.id, null, {
    action: 'DEBT_DELETED',
    entityType: 'DEBT',
    entityId: debtId,
    description: `Dette supprimée: ${debt.id}`,
    amount: Number(debt.remainingAmount),
    oldValue: { status: debt.status },
    newValue: { status: 'CANCELLED', deletedAt: true },
  });
  return { success: true, id: debtId };
}

export async function registerDebtPayment(
  ownerId: string,
  debtId: string,
  data: { amount: number; paymentMethod?: string; notes?: string; proofUrl?: string }
) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({
    where: { id: debtId, businessId: business.id, deletedAt: null },
  });
  if (!debt) throw new AppError('Dette non trouvée', 404);
  if (debt.status === 'SETTLED' || debt.status === 'CANCELLED')
    throw new AppError('Dette déjà soldée', 400);

  if (Number(data.amount) <= 0)
    throw new AppError('Le montant du paiement doit être supérieur à 0', 400);
  if (Number(data.amount) > Number(debt.totalAmount))
    throw new AppError('Le montant ne peut pas dépasser le total de la dette', 400);

  const newPaid = Number(debt.amountPaid || 0) + Number(data.amount);
  if (newPaid > Number(debt.totalAmount))
    throw new AppError('Le total des paiements ne peut pas dépasser le montant de la dette', 400);

  const remaining = Number(debt.totalAmount) - newPaid;
  const upd: any = { amountPaid: newPaid, remainingAmount: Math.max(0, remaining) };

  if (remaining <= 0) {
    upd.status = 'SETTLED';
  } else {
    upd.status = 'PARTIALLY_PAID';
  }

  const updated = await prisma.debt.update({
    where: { id: debtId },
    data: upd,
    include: debtInclude,
  });

  await logFinancialAction(business.id, debt.buyerId, {
    action: 'PAYMENT_RECEIVED',
    entityType: 'DEBT',
    entityId: debtId,
    description: `Paiement de ${data.amount} reçu sur dette #${debt.id.substring(0, 8)}`,
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
  const where: Prisma.DebtWhereInput = { buyerId: userId, deletedAt: null };
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
      progression:
        Number(d.totalAmount) > 0
          ? Math.round((Number(d.amountPaid) / Number(d.totalAmount)) * 100)
          : 0,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function clientPayDebt(
  userId: string,
  debtId: string,
  data: { amount: number; paymentMethod?: string; notes?: string }
) {
  const debt = await prisma.debt.findFirst({
    where: { id: debtId, buyerId: userId, deletedAt: null },
  });
  if (!debt) throw new AppError('Dette non trouvée', 404);
  if (debt.status === 'SETTLED' || debt.status === 'CANCELLED')
    throw new AppError('Dette déjà soldée', 400);

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
  const updated = await prisma.debt.updateMany({
    where: { id: debtId, businessId: business.id, deletedAt: null },
    data: { priority: priority as any },
  });
  if (updated.count === 0) throw new AppError('Dette non trouvée', 404);
  return prisma.debt.findUnique({
    where: { id: debtId },
    include: debtInclude,
  });
}

// ===================== ESCROW =====================

export async function createEscrow(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);

  if (data.orderId) {
    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) throw new AppError('Commande non trouvée', 404);
    if (!data.buyerId && order.buyerId) data.buyerId = order.buyerId;
  }
  if (data.invoiceId) {
    const invoice = await prisma.invoice.findUnique({ where: { id: data.invoiceId } });
    if (!invoice) throw new AppError('Facture non trouvée', 404);
    if (!data.buyerId && data.invoiceId) data.buyerId = data.invoiceId;
  }

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

  // Try FedaPay split payment to hold funds (non-blocking)
  if (fedapay.isFedaPayAvailable() && data.buyerPhone) {
    try {
      const tx = await fedapay.createTransaction({
        amount: Number(data.amount),
        mode: 'mtn_open',
        description: `Escrow: ${business.name}`,
        customerPhone: data.buyerPhone,
        customerName: data.buyerName || 'Client',
      });
      await prisma.escrow.update({
        where: { id: escrow.id },
        data: {
          notes: JSON.stringify({
            ...(escrow.notes
              ? JSON.parse(typeof escrow.notes === 'string' ? escrow.notes : '{}')
              : {}),
            fedapayTransactionId: tx.id,
            fedapayStatus: tx.status,
          }),
        },
      });
      logger.info(`Escrow ${escrow.id}: FedaPay transaction ${tx.id} created for holding`);
    } catch (err: any) {
      logger.warn(`Escrow ${escrow.id}: FedaPay hold failed (non-blocking)`, {
        error: err.message,
      });
    }
  }

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
  const escrow = await prisma.escrow.findFirst({
    where: { id: escrowId, businessId: business.id },
  });
  if (!escrow) throw new AppError('Escrow non trouvé', 404);
  if (escrow.status !== 'HELD') throw new AppError('Escrow non disponible pour libération', 400);

  const {
    rate: feeRate,
    commission: fee,
    netAmount,
  } = await calculateCommission(Number(escrow.amount), 'escrow');

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
  const escrow = await prisma.escrow.findFirst({
    where: { id: escrowId, businessId: business.id },
  });
  if (!escrow) throw new AppError('Escrow non trouvé', 404);
  if (escrow.status !== 'HELD' && escrow.status !== 'DISPUTED')
    throw new AppError('Escrow non remboursable', 400);

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
    prisma.escrow.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            buyer: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        invoice: { select: { id: true, invoiceNumber: true, totalAmount: true } },
      },
    }),
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

export async function getEscrowById(ownerId: string, escrowId: string) {
  const business = await getBusinessByOwner(ownerId);
  const escrow = await prisma.escrow.findFirst({
    where: { id: escrowId, businessId: business.id },
    include: {
      order: {
        select: {
          orderNumber: true,
          buyer: { select: { firstName: true, lastName: true, email: true } },
        },
      },
      payments: true,
    },
  });
  if (!escrow) throw new AppError('Escrow non trouvé', 404);
  return escrow;
}

export async function getClientEscrowById(userId: string, escrowId: string) {
  const escrow = await prisma.escrow.findFirst({
    where: { id: escrowId, order: { buyerId: userId } },
    include: {
      business: { select: { name: true, logo: true } },
      order: { select: { orderNumber: true } },
    },
  });
  if (!escrow) throw new AppError('Escrow non trouvé', 404);
  return {
    ...escrow,
    businessName: escrow.business?.name || null,
    reference: escrow.order?.orderNumber || escrow.id.slice(0, 8),
  };
}

export async function clientReleaseEscrow(userId: string, escrowId: string) {
  const escrow = await prisma.escrow.findFirst({
    where: { id: escrowId, order: { buyerId: userId } },
  });
  if (!escrow) throw new AppError('Escrow non trouvé', 404);
  if (escrow.status !== 'HELD') throw new AppError('Escrow non disponible pour libération', 400);

  const {
    rate: feeRate,
    commission: fee,
    netAmount,
  } = await calculateCommission(Number(escrow.amount), 'escrow');

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
      await tx.wallet.update({
        where: { businessId: escrow.businessId },
        data: { balance: newBalance },
      });
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
          metadata: {
            commissionType: 'ESCROW_FEE',
            escrowId,
            escrowAmount: Number(escrow.amount),
            fee,
            feeRate,
          },
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
  if (data.blacklisted !== undefined) {
    upd.blacklisted = data.blacklisted;
  }
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
  if (search)
    where.OR = [
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

export async function sendDebtReminder(
  ownerId: string,
  debtId: string,
  channel: string,
  content?: string
) {
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
    description: `Rappel ${channel} envoyé pour dette #${debt.id.substring(0, 8)}`,
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
    prisma.debtReminder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        debt: { select: { id: true, totalAmount: true, remainingAmount: true, status: true } },
      },
    }),
    prisma.debtReminder.count({ where }),
  ]);
  return { reminders, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ===================== AUTO-SCORING & ESCALATION =====================

export async function autoScoreClientRisk(businessId: string, clientId: string) {
  try {
    let risk = await prisma.clientRisk.findFirst({
      where: { businessId, clientId },
    });
    if (!risk) {
      risk = await prisma.clientRisk.create({
        data: { businessId, clientId },
      });
    }

    const debts = await prisma.debt.findMany({
      where: { businessId, buyerId: clientId },
      include: { reminders: true },
    });

    const totalDebtAmount = debts.reduce((sum, d) => sum + Number(d.totalAmount), 0);
    const latePaymentCount = debts.filter(
      (d) => d.status === 'OVERDUE' || d.status === 'CRITICAL'
    ).length;
    const disputeCount = debts.filter((d) => d.status === 'DISPUTED').length;
    const onTimePaymentCount = debts.filter(
      (d) => d.status === 'SETTLED' && d.dueDate && new Date(d.dueDate) >= new Date(d.createdAt)
    ).length;
    const totalPaid = debts.reduce((sum, d) => sum + Number(d.amountPaid || 0), 0);

    let reliabilityScore = 70;
    reliabilityScore -= Math.min(latePaymentCount * 10, 40);
    reliabilityScore -= Math.min(disputeCount * 15, 30);
    reliabilityScore += Math.min(onTimePaymentCount * 5, 20);
    if (totalPaid > 0) reliabilityScore += 5;
    reliabilityScore = Math.min(100, Math.max(0, reliabilityScore));

    let riskLevel: string;
    if (reliabilityScore > 80) riskLevel = 'LOW';
    else if (reliabilityScore > 60) riskLevel = 'MEDIUM';
    else if (reliabilityScore > 40) riskLevel = 'HIGH';
    else riskLevel = 'CRITICAL';

    const updated = await prisma.clientRisk.update({
      where: { id: risk.id },
      data: {
        riskLevel: riskLevel as any,
        reliabilityScore,
        totalDebtAmount,
        latePaymentCount,
        disputeCount,
      },
    });

    return updated;
  } catch (err) {
    logger.error('autoScoreClientRisk error:', err);
    return null;
  }
}

export async function escalateOverdueDebts(businessId?: string) {
  try {
    const where: any = {
      status: 'OVERDUE',
      dueDate: { lt: new Date() },
      deletedAt: null,
    };
    if (businessId) where.businessId = businessId;

    const overdueDebts = await prisma.debt.findMany({ where });
    let escalated = 0;

    for (const debt of overdueDebts) {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(debt.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysOverdue > 90 && debt.priority !== 'CRITICAL') {
        await prisma.debt.update({
          where: { id: debt.id },
          data: { priority: 'CRITICAL' },
        });
        await logFinancialAction(businessId || debt.businessId, null, {
          action: 'ESCALATED_CRITICAL' as any,
          entityType: 'DEBT',
          entityId: debt.id,
          description: `Dette escaladée au niveau CRITICAL (${daysOverdue} jours de retard)`,
          amount: Number(debt.remainingAmount),
          oldValue: { priority: debt.priority },
          newValue: { priority: 'CRITICAL' },
        });
        escalated++;
      } else if (daysOverdue > 60 && debt.priority === 'LOW') {
        await prisma.debt.update({
          where: { id: debt.id },
          data: { priority: 'MEDIUM' },
        });
        escalated++;
      } else if (daysOverdue > 30 && debt.priority === 'LOW') {
        const clientRisk = await prisma.clientRisk.findFirst({
          where: { businessId: businessId || debt.businessId, clientId: debt.buyerId! },
        });
        if (
          clientRisk &&
          (clientRisk.riskLevel === 'HIGH' || clientRisk.riskLevel === 'CRITICAL')
        ) {
          await prisma.debt.update({
            where: { id: debt.id },
            data: { priority: 'MEDIUM' },
          });
          escalated++;
        }
      }
    }

    return escalated;
  } catch (err) {
    logger.error('escalateOverdueDebts error:', err);
    return 0;
  }
}

export async function autoSendDebtReminders(businessId?: string) {
  try {
    const where: any = {
      status: { in: ['ACTIVE', 'OVERDUE', 'PARTIALLY_PAID'] },
      dueDate: { lt: new Date() },
    };
    if (businessId) where.businessId = businessId;

    const overdueDebts = await prisma.debt.findMany({
      where,
      include: { reminders: true },
    });

    let sent = 0;

    for (const debt of overdueDebts) {
      const recentReminder = debt.reminders.find(
        (r) => new Date(r.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      );
      if (recentReminder) continue;

      await prisma.debtReminder.create({
        data: {
          debtId: debt.id,
          type: 'DUE_DATE',
          channel: 'EMAIL',
          status: 'SENT',
          sentAt: new Date(),
          content: `Rappel automatique: ${debt.remainingAmount} FCFA restants sur votre dette (échéance dépassée)`,
        },
      });

      await logFinancialAction(businessId || debt.businessId, null, {
        action: 'AUTO_REMINDER_SENT' as any,
        entityType: 'DEBT',
        entityId: debt.id,
        description: `Rappel automatique envoyé pour dette #${debt.id.substring(0, 8)}`,
        amount: Number(debt.remainingAmount),
      });

      sent++;
    }

    return sent;
  } catch (err) {
    logger.error('autoSendDebtReminders error:', err);
    return 0;
  }
}

async function logFinancialAction(
  businessId: string,
  userId: string | null,
  data: {
    action: any;
    entityType: string;
    entityId?: string;
    description?: string;
    amount?: number;
    oldValue?: any;
    newValue?: any;
  }
) {
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

export async function getDebtAging(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const now = new Date();
  const allActive = await prisma.debt.findMany({
    where: {
      businessId: business.id,
      deletedAt: null,
      status: { in: ['ACTIVE', 'PARTIALLY_PAID', 'OVERDUE', 'CRITICAL'] },
      dueDate: { not: null },
    },
    select: {
      id: true,
      totalAmount: true,
      remainingAmount: true,
      dueDate: true,
      status: true,
      priority: true,
      buyer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      notes: true,
    },
  });

  const buckets = {
    current: { label: '0-30 jours', min: 0, max: 30, debts: [] as any[], total: 0 },
    warning: { label: '31-60 jours', min: 31, max: 60, debts: [] as any[], total: 0 },
    late: { label: '61-90 jours', min: 61, max: 90, debts: [] as any[], total: 0 },
    critical: { label: '90+ jours', min: 91, max: Infinity, debts: [] as any[], total: 0 },
  };

  for (const debt of allActive) {
    const daysPastDue = Math.floor(
      (now.getTime() - new Date(debt.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
    );
    let bucket: string;
    if (daysPastDue <= 30) bucket = 'current';
    else if (daysPastDue <= 60) bucket = 'warning';
    else if (daysPastDue <= 90) bucket = 'late';
    else bucket = 'critical';

    const entry = {
      id: debt.id,
      remainingAmount: Number(debt.remainingAmount),
      totalAmount: Number(debt.totalAmount),
      daysPastDue,
      dueDate: debt.dueDate,
      status: debt.status,
      priority: debt.priority,
      clientName: debt.buyer
        ? `${debt.buyer.firstName || ''} ${debt.buyer.lastName || ''}`.trim() || null
        : null,
      clientPhone: debt.buyer?.phone || null,
      notes: debt.notes,
    };
    buckets[bucket as keyof typeof buckets].debts.push(entry);
    buckets[bucket as keyof typeof buckets].total += Number(debt.remainingAmount);
  }

  return {
    buckets: {
      current: {
        label: buckets.current.label,
        count: buckets.current.debts.length,
        total: buckets.current.total,
        debts: buckets.current.debts,
      },
      warning: {
        label: buckets.warning.label,
        count: buckets.warning.debts.length,
        total: buckets.warning.total,
        debts: buckets.warning.debts,
      },
      late: {
        label: buckets.late.label,
        count: buckets.late.debts.length,
        total: buckets.late.total,
        debts: buckets.late.debts,
      },
      critical: {
        label: buckets.critical.label,
        count: buckets.critical.debts.length,
        total: buckets.critical.total,
        debts: buckets.critical.debts,
      },
    },
    totalActive: allActive.length,
    totalRemaining: allActive.reduce((s, d) => s + Number(d.remainingAmount), 0),
  };
}

export async function getPaymentStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const debtWhere = { businessId: business.id, deletedAt: null };
  const escrowWhere = { businessId: business.id };
  const riskWhere = { businessId: business.id };

  const [
    totalDebts,
    totalDebtAmount,
    activeDebts,
    activeDebtAmount,
    overdueDebts,
    settledDebts,
    criticalDebts,
    totalPaid,
  ] = await Promise.all([
    prisma.debt.count({ where: debtWhere }),
    prisma.debt.aggregate({ where: debtWhere, _sum: { totalAmount: true } }),
    prisma.debt.count({
      where: { ...debtWhere, status: { in: ['ACTIVE', 'PARTIALLY_PAID'] } },
    }),
    prisma.debt.aggregate({
      where: { ...debtWhere, status: { in: ['ACTIVE', 'PARTIALLY_PAID'] } },
      _sum: { remainingAmount: true },
    }),
    prisma.debt.count({ where: { ...debtWhere, status: 'OVERDUE' } }),
    prisma.debt.count({ where: { ...debtWhere, status: 'SETTLED' } }),
    prisma.debt.count({
      where: {
        ...debtWhere,
        priority: 'CRITICAL',
        status: { notIn: ['SETTLED', 'CANCELLED'] },
      },
    }),
    prisma.debt.aggregate({
      where: { ...debtWhere, status: 'SETTLED' },
      _sum: { amountPaid: true },
    }),
  ]);

  const [escrowHeld, escrowReleased, highRiskClients] = await Promise.all([
    prisma.escrow.aggregate({ where: { ...escrowWhere, status: 'HELD' }, _sum: { amount: true } }),
    prisma.escrow.aggregate({
      where: { ...escrowWhere, status: 'RELEASED' },
      _sum: { amount: true },
    }),
    prisma.clientRisk.count({
      where: { ...riskWhere, riskLevel: { in: ['HIGH', 'CRITICAL'] } },
    }),
  ]);

  // Recovery rate
  const recoveryRate =
    totalDebtAmount._sum.totalAmount && Number(totalDebtAmount._sum.totalAmount) > 0
      ? Math.round(
          (Number(totalPaid._sum.amountPaid || 0) / Number(totalDebtAmount._sum.totalAmount)) * 100
        )
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
