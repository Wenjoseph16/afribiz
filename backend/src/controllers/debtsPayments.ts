import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as debtsPaymentsService from '../services/debtsPayments';

// ===================== DEBTS =====================

export const listDebts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await debtsPaymentsService.listDebts(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getDebt = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const debt = await debtsPaymentsService.getDebt(req.user.id, req.params.id);
  res.json({ success: true, data: debt });
});

export const updateDebt = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const debt = await debtsPaymentsService.updateDebt(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: debt, message: 'Dette mise à jour' });
});

export const registerDebtPayment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const debt = await debtsPaymentsService.registerDebtPayment(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: debt, message: 'Paiement enregistré' });
});

export const updateDebtPriority = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const debt = await debtsPaymentsService.updateDebtPriority(req.user.id, req.params.id, req.body.priority);
  res.json({ success: true, data: debt, message: 'Priorité mise à jour' });
});

// ===================== ESCROW =====================

export const createEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const escrow = await debtsPaymentsService.createEscrow(req.user.id, req.body);
  res.status(201).json({ success: true, data: escrow, message: 'Escrow créé' });
});

export const releaseEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const escrow = await debtsPaymentsService.releaseEscrow(req.user.id, req.params.id);
  res.json({ success: true, data: escrow, message: 'Escrow libéré' });
});

export const refundEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const escrow = await debtsPaymentsService.refundEscrow(req.user.id, req.params.id, req.body.reason);
  res.json({ success: true, data: escrow, message: 'Escrow remboursé' });
});

export const disputeEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const escrow = await debtsPaymentsService.disputeEscrow(req.user.id, req.params.id, req.body.reason);
  res.json({ success: true, data: escrow, message: 'Litige escrow ouvert' });
});

export const listEscrows = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await debtsPaymentsService.listEscrows(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const listClientEscrows = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await debtsPaymentsService.listClientEscrows(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const clientReleaseEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const escrow = await debtsPaymentsService.clientReleaseEscrow(req.user.id, req.params.id);
  res.json({ success: true, data: escrow, message: 'Paiement confirmé — fonds libérés' });
});

export const clientDisputeEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const escrow = await debtsPaymentsService.clientDisputeEscrow(req.user.id, req.params.id, req.body.reason);
  res.json({ success: true, data: escrow, message: 'Litige ouvert' });
});

// ===================== CLIENT RISK =====================

export const getClientRisk = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const risk = await debtsPaymentsService.getClientRisk(req.user.id, req.query.clientId as string);
  res.json({ success: true, data: risk });
});

export const updateClientRisk = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const risk = await debtsPaymentsService.updateClientRisk(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: risk, message: 'Risque client mis à jour' });
});

export const listClientDebts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await debtsPaymentsService.listClientDebts(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const clientPayDebt = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const debt = await debtsPaymentsService.clientPayDebt(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: debt, message: 'Paiement enregistré' });
});

export const listClientRisks = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await debtsPaymentsService.listClientRisks(req.user.id, req.query);
  res.json({ success: true, data: result });
});

// ===================== REMINDERS =====================

export const sendDebtReminder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const reminder = await debtsPaymentsService.sendDebtReminder(req.user.id, req.params.debtId, req.body.channel, req.body.content);
  res.json({ success: true, data: reminder, message: 'Rappel envoyé' });
});

export const listReminders = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await debtsPaymentsService.listReminders(req.user.id, req.query);
  res.json({ success: true, data: result });
});

// ===================== FINANCIAL LOG =====================

export const listFinancialLogs = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await debtsPaymentsService.listFinancialLogs(req.user.id, req.query);
  res.json({ success: true, data: result });
});

// ===================== STATS =====================

export const getPaymentStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const stats = await debtsPaymentsService.getPaymentStats(req.user.id);
  res.json({ success: true, data: stats });
});
