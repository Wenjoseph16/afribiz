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
import { addMovement, normalizeCashMethod } from './cashService';
import { calculateCommission } from './monetizationConfig';
import { config } from '../config/env';
import { processDelivery } from './NotificationChannels';

// ===================== REMINDER CONFIG =====================

const DEFAULT_REMINDER_CONFIG = {
  enabled: true,
  channels: ['WHATSAPP', 'EMAIL'],
  scheduleDays: [3, 7, 15, 30],
  maxRemindersPerDebt: 4,
};

function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.split(`{${key}}`).join(value || ''),
    template
  );
}

function getDebtReference(debt: any): string {
  return debt.order?.orderNumber || debt.invoice?.invoiceNumber || `#${debt.id.slice(0, 8)}`;
}

async function getReminderConfig(businessId: string) {
  let cfg = await prisma.debtReminderConfig.findUnique({ where: { businessId } });
  if (!cfg) {
    cfg = await prisma.debtReminderConfig.create({
      data: {
        businessId,
        ...DEFAULT_REMINDER_CONFIG,
        scheduleDays: [...DEFAULT_REMINDER_CONFIG.scheduleDays],
        channels: [...DEFAULT_REMINDER_CONFIG.channels],
      },
    });
  }
  return cfg;
}

/**
 * Merci automatique quand une dette est soldée : envoie le template `paymentThanks`
 * au client (WhatsApp/SMS/Email selon la config) + notification in-app.
 */
export async function sendPaymentThanks(debt: any, business: any) {
  try {
    if (!debt?.buyer) return null;
    const cfg = await getReminderConfig(debt.businessId);
    const reference = getDebtReference(debt);
    const amount = `${Number(debt.totalAmount).toLocaleString('fr-FR')} FCFA`;
    const clientName =
      [debt.buyer.firstName, debt.buyer.lastName].filter(Boolean).join(' ') || 'Client';
    const message = renderTemplate(cfg.paymentThanks, {
      client: clientName,
      business: business?.name || 'votre commerce',
      montant: amount,
      reference,
      lien: `${config.FRONTEND_URL}/debts-payments/${debt.id}`,
    });

    // Envoi sur le premier canal configuré disponible (préférence WhatsApp > SMS > Email)
    const channels = (cfg.channels || []).filter(
      (c: string) => c === 'WHATSAPP' || c === 'SMS' || c === 'EMAIL'
    );
    let delivered = false;
    for (const channel of channels) {
      if ((channel === 'WHATSAPP' || channel === 'SMS') && debt.buyer.phone) {
        delivered = await processDelivery(channel, debt.buyer.phone, message, business?.name);
      } else if (channel === 'EMAIL' && debt.buyer.email) {
        try {
          const { handleEmailEvent } = await import('./NotificationService');
          await handleEmailEvent({
            type: 'PAYMENT_CONFIRMATION',
            userId: debt.buyer.id,
            metadata: { amount, businessName: business?.name },
          } as any);
          delivered = true;
        } catch {
          delivered = false;
        }
      }
      if (delivered) break;
    }

    await prisma.debtReminder.create({
      data: {
        debtId: debt.id,
        type: 'PAYMENT_CONFIRMATION',
        channel: channels[0] || 'EMAIL',
        status: delivered ? 'SENT' : 'PENDING',
        sentAt: delivered ? new Date() : null,
        content: message,
        errorMessage: delivered ? null : 'Aucun canal configuré',
      },
    });

    // Notification in-app au client
    await prisma.notification
      .create({
        data: {
          userId: debt.buyer.id,
          type: 'PAYMENT_REMINDER',
          title: `Merci pour votre paiement ${business?.name || ''}`.trim(),
          description: message,
          link: `/debts-payments/${debt.id}`,
        },
      })
      .catch(() => null);

    return message;
  } catch (err) {
    logger.warn('sendPaymentThanks failed:', err);
    return null;
  }
}

// ===================== DEBTS =====================

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
    buyerId,
  } = filters;
  const where: Prisma.DebtWhereInput = { businessId: business.id, deletedAt: null };
  if (status) where.status = status as any;
  if (priority) where.priority = priority as any;
  if (sourceType) where.sourceType = sourceType as any;
  if (riskLevel) where.riskLevel = riskLevel as any;
  if (buyerId) where.buyerId = buyerId as string;
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
  const pageNum = Number(page) || 1;
  const limitNum = Math.min(Number(limit) || 20, 100);
  const skip = (pageNum - 1) * limitNum;
  const [debts, total] = await Promise.all([
    prisma.debt.findMany({
      where,
      include: debtInclude,
      skip,
      take: limitNum,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.debt.count({ where }),
  ]);
  // Champs dérivés pour le frontend (Carnet) : nom client, montant restant, référence, retard…
  const mapped = debts.map((d) => ({
    ...d,
    clientName: d.buyer
      ? `${d.buyer.firstName || ''} ${d.buyer.lastName || ''}`.trim() || null
      : null,
    clientPhone: d.buyer?.phone || null,
    clientEmail: d.buyer?.email || null,
    amount: Number(d.remainingAmount),
    paidAmount: Number(d.amountPaid || 0),
    description: d.notes,
    reference: d.order?.orderNumber || d.invoice?.invoiceNumber || d.id.slice(0, 8),
    daysOverdue: d.dueDate
      ? Math.max(0, Math.floor((Date.now() - new Date(d.dueDate).getTime()) / 86400000))
      : 0,
  }));
  return {
    debts: mapped,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  };
}

export async function getDebt(ownerId: string, debtId: string) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({
    where: { id: debtId, businessId: business.id, deletedAt: null },
    include: debtInclude,
  });
  if (!debt) throw new AppError('Dette non trouvée', 404);

  // Historique des paiements reconstruit depuis le journal financier
  // (le modèle Payment n'a pas de debtId ; chaque encaissement est journalisé)
  const logs = await prisma.financialLog.findMany({
    where: {
      businessId: business.id,
      action: 'PAYMENT_RECEIVED',
      // entityType/entityId sont stockés dans metadata (JSON)
      metadata: { path: ['entityId'], equals: debtId },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    ...debt,
    clientName: debt.buyer
      ? `${debt.buyer.firstName || ''} ${debt.buyer.lastName || ''}`.trim() || null
      : null,
    clientPhone: debt.buyer?.phone || null,
    clientEmail: debt.buyer?.email || null,
    amount: Number(debt.remainingAmount),
    description: debt.notes,
    reference: debt.order?.orderNumber || debt.invoice?.invoiceNumber || debt.id.slice(0, 8),
    daysOverdue: debt.dueDate
      ? Math.max(0, Math.floor((Date.now() - new Date(debt.dueDate).getTime()) / 86400000))
      : 0,
    paymentHistory: logs.map((l) => ({
      id: l.id,
      amount: Number(l.amount || 0),
      method: (l.metadata as any)?.paymentMethod || 'CASH',
      status: 'COMPLETED',
      date: l.createdAt,
      createdAt: l.createdAt,
      reference: debt.order?.orderNumber || debt.invoice?.invoiceNumber || debtId.slice(0, 8),
    })),
  };
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
    sendPaymentThanks(updated, business).catch(() => null);
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
    metadata: {
      paymentMethod: (data as any).method || data.paymentMethod || 'CASH',
      notes: data.notes || null,
    },
  });

  // Caisse du jour (Chantier 4) : l'encaissement d'une dette entre dans la caisse
  const method = (data as any).method || data.paymentMethod || 'CASH';
  addMovement(
    ownerId,
    {
      type: 'DEBT_COLLECTION',
      amount: Number(data.amount),
      method: normalizeCashMethod(method),
      label: 'Encaissement dette',
      description: `Paiement sur dette #${debtId.substring(0, 8)}`,
      sourceType: 'DEBT',
      sourceId: debtId,
    },
    ownerId
  ).catch((e: any) => logger.warn(`Caisse: mouvement DEBT_COLLECTION non créé: ${e?.message || e}`));

  if (updated.status === 'SETTLED') {
    sendPaymentThanks(updated, business).catch(() => null);
    publishDebtSettled({
      userId: ownerId,
      debtId,
      businessId: business.id,
      amount: String(debt.totalAmount),
    });
  }

  return updated;
}

/**
 * « Coller la dette » : transforme une commande (ou facture) en dette pour un client.
 * Utilisé quand le client achète en cash et ne règle pas / ne paie que partiellement.
 */
export async function attachDebtToOrder(
  ownerId: string,
  data: {
    orderId?: string;
    invoiceId?: string;
    amount?: number;
    dueDate?: string;
    notes?: string;
    buyerId?: string;
  }
) {
  const business = await getBusinessByOwner(ownerId);

  let order: any = null;
  let invoice: any = null;
  let buyerId = data.buyerId;
  let totalAmount = data.amount;

  if (data.orderId) {
    order = await prisma.order.findFirst({
      where: { id: data.orderId, businessId: business.id },
      include: { buyer: { select: { id: true } }, debts: true },
    });
    if (!order) throw new AppError('Commande non trouvée', 404);
    if (order.debts.length > 0) throw new AppError('Cette commande a déjà une dette', 400);
    // Garde-fou : on ne colle une dette que sur une commande réellement impayée
    if (
      order.paymentStatus === 'COMPLETED' ||
      Number(order.amountPaid || 0) >= Number(order.totalAmount || 0)
    )
      throw new AppError('Cette commande est déjà payée', 400);
    buyerId = buyerId || order.buyerId || null;
    totalAmount = totalAmount || Number(order.totalAmount || 0);
  }

  if (data.invoiceId) {
    invoice = await prisma.invoice.findFirst({
      where: { id: data.invoiceId, businessId: business.id },
    });
    if (!invoice) throw new AppError('Facture non trouvée', 404);
    buyerId = buyerId || invoice.clientId || null;
    totalAmount = totalAmount || Number(invoice.totalAmount || 0);
  }

  if (!totalAmount || Number(totalAmount) <= 0)
    throw new AppError('Montant de la dette requis', 400);

  const remaining = Number(totalAmount);
  const dueDate = data.dueDate
    ? new Date(data.dueDate)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const debt = await prisma.debt.create({
    data: {
      businessId: business.id,
      buyerId: buyerId || null,
      orderId: data.orderId || null,
      invoiceId: data.invoiceId || null,
      totalAmount: remaining,
      remainingAmount: remaining,
      dueDate,
      status: 'ACTIVE',
      sourceType: data.orderId ? 'ORDER' : data.invoiceId ? 'INVOICE' : 'MANUAL',
      notes: data.notes || null,
    },
    include: debtInclude,
  });

  await logFinancialAction(business.id, buyerId || null, {
    action: 'DEBT_CREATED',
    entityType: 'DEBT',
    entityId: debt.id,
    description: `Dette collée (${remaining} FCFA) sur commande/facture pour client`,
    amount: remaining,
  });

  return debt;
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

  if (updated.status === 'SETTLED') {
    // Merci automatique au client + notifier le business que la dette est soldée
    try {
      const business = await prisma.business.findUnique({
        where: { id: debt.businessId },
        select: { id: true, name: true, ownerId: true },
      });
      const fullDebt = await prisma.debt.findUnique({
        where: { id: debtId },
        include: debtInclude,
      });
      if (fullDebt) sendPaymentThanks(fullDebt, business).catch(() => null);
      if (business?.ownerId) {
        publishDebtSettled({
          userId: business.ownerId,
          debtId,
          businessId: debt.businessId,
          amount: String(debt.totalAmount),
        });
      }
    } catch (e) {
      logger.warn('clientPayDebt settled notification failed:', e);
    }
  }

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

// ===================== REMINDERS & CONFIG =====================

export async function getDebtReminderConfig(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  return getReminderConfig(business.id);
}

export async function updateDebtReminderConfig(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const cfg = await getReminderConfig(business.id);
  const upd: any = {};
  if (data.enabled !== undefined) upd.enabled = data.enabled;
  if (Array.isArray(data.channels)) upd.channels = data.channels;
  if (Array.isArray(data.scheduleDays))
    upd.scheduleDays = data.scheduleDays.map(Number).filter(Boolean);
  if (data.maxRemindersPerDebt !== undefined)
    upd.maxRemindersPerDebt = Number(data.maxRemindersPerDebt);
  if (typeof data.dueDateMessage === 'string' && data.dueDateMessage.trim())
    upd.dueDateMessage = data.dueDateMessage;
  if (typeof data.overdueMessage === 'string' && data.overdueMessage.trim())
    upd.overdueMessage = data.overdueMessage;
  if (typeof data.criticalMessage === 'string' && data.criticalMessage.trim())
    upd.criticalMessage = data.criticalMessage;
  if (typeof data.paymentThanks === 'string' && data.paymentThanks.trim())
    upd.paymentThanks = data.paymentThanks;

  return prisma.debtReminderConfig.update({ where: { id: cfg.id }, data: upd });
}

export async function sendDebtReminder(
  ownerId: string,
  debtId: string,
  channel: string,
  content?: string
) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({
    where: { id: debtId, businessId: business.id, deletedAt: null },
    include: {
      order: { select: { orderNumber: true } },
      invoice: { select: { invoiceNumber: true } },
      buyer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    },
  });
  if (!debt) throw new AppError('Dette non trouvée', 404);

  const cfg = await getReminderConfig(business.id);
  const reference = getDebtReference(debt);
  const amount = `${Number(debt.remainingAmount).toLocaleString('fr-FR')} FCFA`;
  const clientName =
    [debt.buyer?.firstName, debt.buyer?.lastName].filter(Boolean).join(' ') || 'Client';
  const paymentUrl = `${config.FRONTEND_URL}/debts-payments/${debtId}`;

  const type =
    debt.status === 'CRITICAL'
      ? 'CRITICAL_DEBT'
      : debt.status === 'OVERDUE'
        ? 'OVERDUE'
        : 'DUE_DATE';
  const template =
    type === 'CRITICAL_DEBT'
      ? cfg.criticalMessage
      : type === 'OVERDUE'
        ? cfg.overdueMessage
        : cfg.dueDateMessage;
  const message = renderTemplate(template, {
    client: clientName,
    business: business.name,
    montant: amount,
    reference,
    lien: paymentUrl,
  });

  const reminder = await prisma.debtReminder.create({
    data: {
      debtId,
      type: type as any,
      channel: channel as any,
      status: 'PENDING',
      content: content || message,
    },
  });

  let delivered = true;
  // Envoi réel sur WhatsApp/SMS/Email via les canaux (dev: loggé, prod: Twilio/…)
  if (debt.buyer?.phone && (channel === 'WHATSAPP' || channel === 'SMS')) {
    try {
      delivered = await processDelivery(
        channel,
        debt.buyer.phone,
        content || message,
        business.name
      );
    } catch (e) {
      logger.warn(`Reminder ${channel} delivery failed:`, e);
      delivered = false;
    }
  } else if (debt.buyer?.email && channel === 'EMAIL') {
    // Email envoyé via le pipeline notification existant
    try {
      const { handleEmailEvent } = await import('./NotificationService');
      await handleEmailEvent({
        type: 'DEBT_OVERDUE',
        userId: debt.buyer.id,
        metadata: { amount, businessName: business.name },
      } as any);
      delivered = true;
    } catch {
      delivered = false;
    }
  }

  // Notification in-app au client (liée à sa dette)
  if (debt.buyer) {
    try {
      await prisma.notification.create({
        data: {
          userId: debt.buyer.id,
          type: 'PAYMENT_REMINDER',
          title: `Rappel de paiement ${business.name}`,
          description: content || message,
          link: `/debts-payments/${debtId}`,
        },
      });
    } catch (e) {
      logger.warn('Reminder in-app notification failed:', e);
    }
  }

  await prisma.debtReminder.update({
    where: { id: reminder.id },
    data: {
      status: delivered ? 'SENT' : 'FAILED',
      sentAt: delivered ? new Date() : null,
      errorMessage: delivered ? null : 'Channel delivery failed',
    },
  });

  await logFinancialAction(business.id, null, {
    action: 'REMINDER_SENT',
    entityType: 'DEBT',
    entityId: debtId,
    description: `Rappel ${channel} envoyé pour dette ${reference}`,
    amount: Number(debt.remainingAmount),
  });

  return prisma.debtReminder.findUnique({ where: { id: reminder.id } });
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
        debt: {
          select: {
            id: true,
            totalAmount: true,
            remainingAmount: true,
            status: true,
            buyer: { select: { firstName: true, lastName: true, phone: true } },
            order: { select: { orderNumber: true } },
            invoice: { select: { invoiceNumber: true } },
          },
        },
      },
    }),
    prisma.debtReminder.count({ where }),
  ]);
  return { reminders, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ===================== AUTO-SCORING, ESCALADE & RAPPELS AUTO =====================

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
      status: { in: ['ACTIVE', 'OVERDUE', 'PARTIALLY_PAID'] },
      dueDate: { lt: new Date() },
      deletedAt: null,
    };
    if (businessId) where.businessId = businessId;

    const overdueDebts = await prisma.debt.findMany({ where });
    let escalated = 0;

    for (const debt of overdueDebts) {
      const daysOverdue = Math.max(
        0,
        Math.floor((Date.now() - new Date(debt.dueDate!).getTime()) / (1000 * 60 * 60 * 24))
      );

      const nextPriority =
        daysOverdue > 90
          ? 'CRITICAL'
          : daysOverdue > 60
            ? 'HIGH'
            : daysOverdue > 30
              ? 'MEDIUM'
              : 'LOW';
      const nextStatus = daysOverdue > 15 ? 'CRITICAL' : daysOverdue > 3 ? 'OVERDUE' : 'ACTIVE';

      if (debt.priority !== nextPriority || debt.status !== nextStatus) {
        await prisma.debt.update({
          where: { id: debt.id },
          data: { priority: nextPriority as any, status: nextStatus as any },
        });
        await logFinancialAction(businessId || debt.businessId, null, {
          action: 'ESCALATED_CRITICAL' as any,
          entityType: 'DEBT',
          entityId: debt.id,
          description: `Dette escaladée (${daysOverdue} jours de retard) → ${nextPriority}/${nextStatus}`,
          amount: Number(debt.remainingAmount),
          oldValue: { priority: debt.priority, status: debt.status },
          newValue: { priority: nextPriority, status: nextStatus },
        });
        escalated++;
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
      remainingAmount: { gt: 0 },
    };
    if (businessId) where.businessId = businessId;

    const overdueDebts = await prisma.debt.findMany({
      where,
      include: {
        reminders: true,
        order: { select: { orderNumber: true } },
        invoice: { select: { invoiceNumber: true } },
        buyer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    let sent = 0;
    const businessCache = new Map<string, any>();

    for (const debt of overdueDebts) {
      const cfg = await getReminderConfig(debt.businessId);
      if (!cfg.enabled) continue;

      // Nombre de rappels déjà envoyés sur cette dette (les « merci » ne comptent pas)
      const sentCount = debt.reminders.filter(
        (r) => r.status === 'SENT' && r.type !== 'PAYMENT_CONFIRMATION'
      ).length;
      if (sentCount >= cfg.maxRemindersPerDebt) continue;

      const daysOverdue = Math.max(
        0,
        Math.floor((Date.now() - new Date(debt.dueDate!).getTime()) / (1000 * 60 * 60 * 24))
      );
      const schedule = (cfg.scheduleDays || []).map(Number).filter((d: number) => d > 0);
      if (schedule.length === 0) continue;

      // Trouver le prochain palier (J+X) atteint mais pas encore envoyé
      const reached = schedule.filter((d: number) => daysOverdue >= d);
      if (reached.length === 0) continue;
      const targetDay = reached[reached.length - 1];
      const alreadyAtTarget = debt.reminders.some(
        (r) => r.status === 'SENT' && r.metadataDay === targetDay
      );
      if (alreadyAtTarget) continue;

      // Résoudre le nom du business (avec cache)
      let businessName = 'votre commerce';
      if (businessCache.has(debt.businessId)) {
        businessName = businessCache.get(debt.businessId);
      } else {
        const b = await prisma.business.findUnique({
          where: { id: debt.businessId },
          select: { name: true },
        });
        businessName = b?.name || 'votre commerce';
        businessCache.set(debt.businessId, businessName);
      }

      const reference = getDebtReference(debt);
      const amount = `${Number(debt.remainingAmount).toLocaleString('fr-FR')} FCFA`;
      const clientName =
        [debt.buyer?.firstName, debt.buyer?.lastName].filter(Boolean).join(' ') || 'Client';
      const paymentUrl = `${config.FRONTEND_URL}/debts-payments/${debt.id}`;

      const type = targetDay >= 15 ? 'CRITICAL_DEBT' : targetDay >= 7 ? 'OVERDUE' : 'DUE_DATE';
      const template =
        type === 'CRITICAL_DEBT'
          ? cfg.criticalMessage
          : type === 'OVERDUE'
            ? cfg.overdueMessage
            : cfg.dueDateMessage;
      const message = renderTemplate(template, {
        client: clientName,
        business: businessName,
        montant: amount,
        reference,
        lien: paymentUrl,
      });

      // Envoi sur chaque canal configuré
      const channels = (cfg.channels || []).filter(
        (c: string) => c === 'WHATSAPP' || c === 'SMS' || c === 'EMAIL'
      );
      let anyDelivered = false;
      for (const channel of channels) {
        let delivered = false;
        if ((channel === 'WHATSAPP' || channel === 'SMS') && debt.buyer?.phone) {
          try {
            delivered = await processDelivery(channel, debt.buyer.phone, message, businessName);
          } catch (e) {
            logger.warn(`Auto reminder ${channel} delivery failed:`, e);
            delivered = false;
          }
        } else if (channel === 'EMAIL' && debt.buyer?.email) {
          try {
            const { handleEmailEvent } = await import('./NotificationService');
            await handleEmailEvent({
              type: 'DEBT_OVERDUE',
              userId: debt.buyer.id,
              metadata: { amount, businessName },
            } as any);
            delivered = true;
          } catch {
            delivered = false;
          }
        }
        anyDelivered = anyDelivered || delivered;
        await prisma.debtReminder.create({
          data: {
            debtId: debt.id,
            type: type as any,
            channel: channel as any,
            status: delivered ? 'SENT' : 'FAILED',
            sentAt: delivered ? new Date() : null,
            content: message,
            errorMessage: delivered ? null : 'Channel delivery failed',
            metadataDay: targetDay,
          } as any,
        });
      }

      // Notification in-app au client
      if (debt.buyer) {
        try {
          await prisma.notification.create({
            data: {
              userId: debt.buyer.id,
              type: 'PAYMENT_REMINDER',
              title: `Rappel de paiement ${businessName}`,
              description: message,
              link: `/debts-payments/${debt.id}`,
            },
          });
        } catch (e) {
          logger.warn('Auto reminder in-app failed:', e);
        }
      }

      await logFinancialAction(debt.businessId, null, {
        action: 'AUTO_REMINDER_SENT' as any,
        entityType: 'DEBT',
        entityId: debt.id,
        description: `Rappel auto (J+${targetDay}) envoyé pour dette ${reference}`,
        amount: Number(debt.remainingAmount),
        metadata: { day: targetDay, channels },
      });

      if (anyDelivered) sent++;
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
    metadata?: any;
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
          ...(data.metadata || {}),
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
