import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { prisma } from '../lib/db';
import * as debtsPaymentsService from '../services/debtsPayments';

// ===================== DEBTS =====================

export const listDebts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await debtsPaymentsService.listDebts(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getDebt = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const debt = await debtsPaymentsService.getDebt(req.user.id, req.params.id);
  res.json({ success: true, data: debt });
});

export const updateDebt = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const debt = await debtsPaymentsService.updateDebt(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: debt, message: 'Dette mise à jour' });
});

export const attachDebt = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const debt = await debtsPaymentsService.attachDebtToOrder(req.user.id, req.body);
  res.json({ success: true, data: debt, message: 'Dette collée au client' });
});

export const registerDebtPayment = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const debt = await debtsPaymentsService.registerDebtPayment(
      req.user.id,
      req.params.id,
      req.body
    );
    res.json({ success: true, data: debt, message: 'Paiement enregistré' });
  }
);

export const deleteDebtCtrl = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await debtsPaymentsService.deleteDebt(req.user.id, req.params.id);
    res.json({ success: true, data: result, message: 'Dette supprimée' });
  }
);

export const updateDebtPriority = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const debt = await debtsPaymentsService.updateDebtPriority(
      req.user.id,
      req.params.id,
      req.body.priority
    );
    res.json({ success: true, data: debt, message: 'Priorité mise à jour' });
  }
);

// ===================== ESCROW =====================

export const createEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const escrow = await debtsPaymentsService.createEscrow(req.user.id, req.body);
  res.status(201).json({ success: true, data: escrow, message: 'Escrow créé' });
});

export const releaseEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const escrow = await debtsPaymentsService.releaseEscrow(req.user.id, req.params.id);
  res.json({ success: true, data: escrow, message: 'Escrow libéré' });
});

export const refundEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const escrow = await debtsPaymentsService.refundEscrow(
    req.user.id,
    req.params.id,
    req.body.reason
  );
  res.json({ success: true, data: escrow, message: 'Escrow remboursé' });
});

export const disputeEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const escrow = await debtsPaymentsService.disputeEscrow(
    req.user.id,
    req.params.id,
    req.body.reason
  );
  res.json({ success: true, data: escrow, message: 'Litige escrow ouvert' });
});

export const listEscrows = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await debtsPaymentsService.listEscrows(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const listClientEscrows = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await debtsPaymentsService.listClientEscrows(req.user.id, req.query);
    res.json({ success: true, data: result });
  }
);

export const clientReleaseEscrow = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const escrow = await debtsPaymentsService.clientReleaseEscrow(req.user.id, req.params.id);
    res.json({ success: true, data: escrow, message: 'Paiement confirmé — fonds libérés' });
  }
);

export const clientDisputeEscrow = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const escrow = await debtsPaymentsService.clientDisputeEscrow(
      req.user.id,
      req.params.id,
      req.body.reason
    );
    res.json({ success: true, data: escrow, message: 'Litige ouvert' });
  }
);

// ===================== CLIENT RISK =====================

export const getClientRisk = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const risk = await debtsPaymentsService.getClientRisk(req.user.id, req.query.clientId as string);
  res.json({ success: true, data: risk });
});

export const updateClientRisk = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const risk = await debtsPaymentsService.updateClientRisk(req.user.id, req.params.id, req.body);
    res.json({ success: true, data: risk, message: 'Risque client mis à jour' });
  }
);

export const listClientDebts = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await debtsPaymentsService.listClientDebts(req.user.id, req.query);
    res.json({ success: true, data: result });
  }
);

export const clientPayDebt = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const debt = await debtsPaymentsService.clientPayDebt(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: debt, message: 'Paiement enregistré' });
});

export const listClientRisks = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await debtsPaymentsService.listClientRisks(req.user.id, req.query);
    res.json({ success: true, data: result });
  }
);

// ===================== REMINDERS =====================

export const sendDebtReminder = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const reminder = await debtsPaymentsService.sendDebtReminder(
      req.user.id,
      req.params.debtId,
      req.body.channel,
      req.body.content
    );
    res.json({ success: true, data: reminder, message: 'Rappel envoyé' });
  }
);

export const listReminders = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await debtsPaymentsService.listReminders(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getReminderConfig = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const config = await debtsPaymentsService.getDebtReminderConfig(req.user.id);
    res.json({ success: true, data: config });
  }
);

export const updateReminderConfig = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const config = await debtsPaymentsService.updateDebtReminderConfig(req.user.id, req.body);
    res.json({ success: true, data: config, message: 'Configuration rappels mise à jour' });
  }
);

// ===================== FINANCIAL LOG =====================

export const listFinancialLogs = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await debtsPaymentsService.listFinancialLogs(req.user.id, req.query);
    res.json({ success: true, data: result });
  }
);

// ===================== STATS =====================

export const getDebtAging = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const aging = await debtsPaymentsService.getDebtAging(req.user.id);
  res.json({ success: true, data: aging });
});

export const getPaymentStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const stats = await debtsPaymentsService.getPaymentStats(req.user.id);
    res.json({ success: true, data: stats });
  }
);

// ===================== AUTO-SCORING & ESCALATION =====================

export const autoScoreClientRisk = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { clientId } = req.body;
    if (!clientId) throw new AppError('clientId requis', 400);
    const business = await prisma.business.findUnique({
      where: { ownerId: req.user.id, deletedAt: null },
      select: { id: true },
    });
    if (!business) throw new AppError('Business not found', 404);
    const result = await debtsPaymentsService.autoScoreClientRisk(business.id, clientId);
    res.json({ success: true, data: result });
  }
);

export const escalateOverdueDebts = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const business = await prisma.business.findUnique({
      where: { ownerId: req.user.id, deletedAt: null },
      select: { id: true },
    });
    if (!business) throw new AppError('Business not found', 404);
    const count = await debtsPaymentsService.escalateOverdueDebts(business.id);
    res.json({ success: true, data: { escalated: count } });
  }
);

export const autoSendDebtReminders = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const business = await prisma.business.findUnique({
      where: { ownerId: req.user.id, deletedAt: null },
      select: { id: true },
    });
    if (!business) throw new AppError('Business not found', 404);
    const count = await debtsPaymentsService.autoSendDebtReminders(business.id);
    res.json({ success: true, data: { sent: count } });
  }
);
