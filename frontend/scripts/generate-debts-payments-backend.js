const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..', '..', 'backend', 'src');

// ============= SERVICE =============
const serviceContent = `import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true, settings: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('DEBTS_PAYMENTS')) throw new AppError('Module Dettes & Paiements non activé', 403);
  return business;
}

const debtInclude = {
  order: { select: { id: true, orderNumber: true, totalAmount: true } },
  invoice: { select: { id: true, invoiceNumber: true, total: true } },
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

  if (data.status === 'SETTLED') { upd.settledAt = new Date(); upd.remainingAmount = 0; upd.paidAmount = debt.totalAmount; }
  if (data.status === 'WRITTEN_OFF') { upd.writtenOffAt = new Date(); upd.writeOffReason = data.writeOffReason || 'Passé en perte'; }

  await logFinancialAction(business.id, null, {
    action: 'DEBT_UPDATED',
    entityType: 'DEBT',
    entityId: debtId,
    description: \`Dette mise à jour: \${debt.id}\`,
    amount: debt.remainingAmount,
    oldValue: { status: debt.status, priority: debt.priority },
    newValue: { status: upd.status || debt.status, priority: upd.priority || debt.priority },
  });

  return prisma.debt.update({ where: { id: debtId }, data: upd, include: debtInclude });
}

export async function registerDebtPayment(ownerId: string, debtId: string, data: { amount: number; paymentMethod?: string; notes?: string; proofUrl?: string }) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({ where: { id: debtId, businessId: business.id } });
  if (!debt) throw new AppError('Dette non trouvée', 404);
  if (debt.status === 'SETTLED' || debt.status === 'WRITTEN_OFF') throw new AppError('Dette déjà soldée', 400);

  const newPaid = Number(debt.paidAmount) + Number(data.amount);
  const remaining = Number(debt.totalAmount) - newPaid;
  const upd: any = { paidAmount: newPaid, remainingAmount: Math.max(0, remaining) };

  if (remaining <= 0) { upd.status = 'SETTLED'; upd.settledAt = new Date(); }
  else { upd.status = 'PARTIALLY_PAID'; }

  const updated = await prisma.debt.update({ where: { id: debtId }, data: upd, include: debtInclude });

  await logFinancialAction(business.id, debt.buyerId, {
    action: 'PAYMENT_RECEIVED',
    entityType: 'DEBT',
    entityId: debtId,
    description: \`Paiement de \${data.amount} reçu sur dette #\${debt.id.substring(0,8)}\`,
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
      releaseType: data.releaseType || 'AUTO',
      releaseRules: data.releaseRules || undefined,
      releaseAt: data.releaseAt ? new Date(data.releaseAt) : null,
      heldAt: new Date(),
    },
  });

  await logFinancialAction(business.id, null, {
    action: 'ESCROW_HELD',
    entityType: 'ESCROW',
    entityId: escrow.id,
    description: \`Escrow créé: \${data.amount}\`,
    amount: data.amount,
  });

  return escrow;
}

export async function releaseEscrow(ownerId: string, escrowId: string) {
  const business = await getBusinessByOwner(ownerId);
  const escrow = await prisma.escrow.findFirst({ where: { id: escrowId, businessId: business.id } });
  if (!escrow) throw new AppError('Escrow non trouvé', 404);
  if (escrow.status !== 'HELD') throw new AppError('Escrow non disponible pour libération', 400);

  const updated = await prisma.escrow.update({
    where: { id: escrowId },
    data: { status: 'RELEASED', releasedAt: new Date() },
  });

  await logFinancialAction(business.id, null, {
    action: 'ESCROW_RELEASED',
    entityType: 'ESCROW',
    entityId: escrowId,
    description: \`Escrow libéré: \${escrow.amount}\`,
    amount: escrow.amount,
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
    description: \`Escrow remboursé: \${escrow.amount} - \${reason || ''}\`,
    amount: escrow.amount,
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
    description: \`Litige escrow: \${reason}\`,
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

// ===================== CLIENT RISK =====================

export async function getClientRisk(ownerId: string, clientId?: string, phone?: string) {
  const business = await getBusinessByOwner(ownerId);
  const where: any = { businessId: business.id };
  if (clientId) where.clientId = clientId;
  else if (phone) where.customerPhone = phone;
  else throw new AppError('Spécifiez clientId ou phone', 400);

  let risk = await prisma.clientRisk.findFirst({ where });
  if (!risk) {
    risk = await prisma.clientRisk.create({
      data: { businessId: business.id, clientId: clientId || null, customerPhone: phone || null },
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
  if (data.blacklisted !== undefined) { upd.blacklisted = data.blacklisted; upd.blacklistedAt = data.blacklisted ? new Date() : null; upd.blacklistReason = data.blacklistReason || null; }
  if (data.requireDeposit !== undefined) upd.requireDeposit = data.requireDeposit;
  if (data.maxCreditLimit !== undefined) upd.maxCreditLimit = data.maxCreditLimit;

  await logFinancialAction(business.id, null, {
    action: 'RISK_UPDATED',
    entityType: 'CLIENT_RISK',
    entityId: riskId,
    description: \`Risque client mis à jour\`,
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
    { customerName: { contains: search, mode: 'insensitive' } },
    { customerPhone: { contains: search, mode: 'insensitive' } },
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
      content: content || \`Rappel: \${debt.remainingAmount} FCFA restants sur votre dette\`,
    },
  });

  // Simulate sending (in production: integrate WhatsApp/SMS/Email)
  await prisma.debtReminder.update({
    where: { id: reminder.id },
    data: { status: 'SENT', sentAt: new Date() },
  });

  await prisma.debt.update({
    where: { id: debtId },
    data: { remindersSent: { increment: 1 }, lastRemindedAt: new Date(), nextReminderAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  await logFinancialAction(business.id, null, {
    action: 'REMINDER_SENT',
    entityType: 'DEBT',
    entityId: debtId,
    description: \`Rappel \${channel} envoyé pour dette #\${debt.id.substring(0,8)}\`,
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

async function logFinancialAction(businessId: string | null, userId: string | null, data: { action: any; entityType: string; entityId?: string; description?: string; amount?: number; oldValue?: any; newValue?: any }) {
  try {
    await prisma.financialLog.create({
      data: {
        businessId,
        userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || null,
        description: data.description || null,
        amount: data.amount || null,
        oldValue: data.oldValue || null,
        newValue: data.newValue || null,
      },
    });
  } catch (e) {
    // Log silently - financial log should never break the main operation
    console.error('Failed to log financial action:', e);
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
    prisma.debt.count({ where: { ...where, priority: 'CRITICAL', status: { notIn: ['SETTLED', 'WRITTEN_OFF'] } } }),
    prisma.debt.aggregate({ where: { ...where, status: 'SETTLED' }, _sum: { paidAmount: true } }),
  ]);

  const [escrowHeld, escrowReleased, highRiskClients] = await Promise.all([
    prisma.escrow.aggregate({ where: { ...where, status: 'HELD' }, _sum: { amount: true } }),
    prisma.escrow.aggregate({ where: { ...where, status: 'RELEASED' }, _sum: { amount: true } }),
    prisma.clientRisk.count({ where: { ...where, riskLevel: { in: ['HIGH', 'CRITICAL'] } } }),
  ]);

  // Recovery rate
  const recoveryRate = totalDebtAmount._sum.totalAmount && Number(totalDebtAmount._sum.totalAmount) > 0
    ? Math.round((Number(totalPaid._sum.paidAmount || 0) / Number(totalDebtAmount._sum.totalAmount)) * 100)
    : 0;

  return {
    totalDebts,
    totalDebtAmount: totalDebtAmount._sum.totalAmount || 0,
    activeDebts,
    activeDebtAmount: activeDebtAmount._sum.remainingAmount || 0,
    overdueDebts,
    criticalDebts,
    settledDebts,
    totalRecovered: totalPaid._sum.paidAmount || 0,
    recoveryRate,
    escrowHeld: escrowHeld._sum.amount || 0,
    escrowReleased: escrowReleased._sum.amount || 0,
    highRiskClients,
  };
}
`;

// ============= CONTROLLER =============
const controllerContent = `import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as debtsPaymentsService from '../services/debtsPayments';

// ===================== DEBTS =====================

export const listDebts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await debtsPaymentsService.listDebts(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getDebt = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const debt = await debtsPaymentsService.getDebt(req.user.id, req.params.id);
  res.json({ success: true, data: debt });
});

export const updateDebt = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const debt = await debtsPaymentsService.updateDebt(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: debt, message: 'Dette mise à jour' });
});

export const registerDebtPayment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const debt = await debtsPaymentsService.registerDebtPayment(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: debt, message: 'Paiement enregistré' });
});

export const updateDebtPriority = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const debt = await debtsPaymentsService.updateDebtPriority(req.user.id, req.params.id, req.body.priority);
  res.json({ success: true, data: debt, message: 'Priorité mise à jour' });
});

// ===================== ESCROW =====================

export const createEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const escrow = await debtsPaymentsService.createEscrow(req.user.id, req.body);
  res.status(201).json({ success: true, data: escrow, message: 'Escrow créé' });
});

export const releaseEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const escrow = await debtsPaymentsService.releaseEscrow(req.user.id, req.params.id);
  res.json({ success: true, data: escrow, message: 'Escrow libéré' });
});

export const refundEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const escrow = await debtsPaymentsService.refundEscrow(req.user.id, req.params.id, req.body.reason);
  res.json({ success: true, data: escrow, message: 'Escrow remboursé' });
});

export const disputeEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const escrow = await debtsPaymentsService.disputeEscrow(req.user.id, req.params.id, req.body.reason);
  res.json({ success: true, data: escrow, message: 'Litige escrow ouvert' });
});

export const listEscrows = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await debtsPaymentsService.listEscrows(req.user.id, req.query);
  res.json({ success: true, data: result });
});

// ===================== CLIENT RISK =====================

export const getClientRisk = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const risk = await debtsPaymentsService.getClientRisk(req.user.id, req.query.clientId as string, req.query.phone as string);
  res.json({ success: true, data: risk });
});

export const updateClientRisk = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const risk = await debtsPaymentsService.updateClientRisk(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: risk, message: 'Risque client mis à jour' });
});

export const listClientRisks = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await debtsPaymentsService.listClientRisks(req.user.id, req.query);
  res.json({ success: true, data: result });
});

// ===================== REMINDERS =====================

export const sendDebtReminder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const reminder = await debtsPaymentsService.sendDebtReminder(req.user.id, req.params.debtId, req.body.channel, req.body.content);
  res.json({ success: true, data: reminder, message: 'Rappel envoyé' });
});

export const listReminders = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await debtsPaymentsService.listReminders(req.user.id, req.query);
  res.json({ success: true, data: result });
});

// ===================== FINANCIAL LOG =====================

export const listFinancialLogs = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await debtsPaymentsService.listFinancialLogs(req.user.id, req.query);
  res.json({ success: true, data: result });
});

// ===================== STATS =====================

export const getPaymentStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const stats = await debtsPaymentsService.getPaymentStats(req.user.id);
  res.json({ success: true, data: stats });
});
`;

// ============= ROUTES =============
const routesContent = `import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  listDebts, getDebt, updateDebt, registerDebtPayment, updateDebtPriority,
  createEscrow, releaseEscrow, refundEscrow, disputeEscrow, listEscrows,
  getClientRisk, updateClientRisk, listClientRisks,
  sendDebtReminder, listReminders,
  listFinancialLogs, getPaymentStats,
} from '../controllers/debtsPayments';

const router = Router();

router.use(authenticate);

// Debts
router.get('/debts', listDebts);
router.get('/debts/:id', getDebt);
router.patch('/debts/:id', updateDebt);
router.post('/debts/:id/payment', registerDebtPayment);
router.patch('/debts/:id/priority', updateDebtPriority);

// Escrow
router.post('/escrow', createEscrow);
router.get('/escrow', listEscrows);
router.post('/escrow/:id/release', releaseEscrow);
router.post('/escrow/:id/refund', refundEscrow);
router.post('/escrow/:id/dispute', disputeEscrow);

// Client Risk
router.get('/client-risks', listClientRisks);
router.get('/client-risks/lookup', getClientRisk);
router.patch('/client-risks/:id', updateClientRisk);

// Reminders
router.post('/debts/:debtId/reminder', sendDebtReminder);
router.get('/reminders', listReminders);

// Financial Log
router.get('/logs', listFinancialLogs);

// Stats
router.get('/stats', getPaymentStats);

export default router;
`;

// Write files
const files = [
  { path: path.join(backendDir, 'services', 'debtsPayments.ts'), content: serviceContent },
  { path: path.join(backendDir, 'controllers', 'debtsPayments.ts'), content: controllerContent },
  { path: path.join(backendDir, 'routes', 'debtsPayments.ts'), content: routesContent },
];

for (const file of files) {
  fs.mkdirSync(path.dirname(file.path), { recursive: true });
  fs.writeFileSync(file.path, file.content, 'utf-8');
  console.log('Created:', file.path);
}

console.log('✅ Module 8 backend généré');
