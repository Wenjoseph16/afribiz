import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  listDebts, getDebt, updateDebt, registerDebtPayment, updateDebtPriority,
  createEscrow, releaseEscrow, refundEscrow, disputeEscrow, listEscrows, listClientEscrows,
  getClientRisk, updateClientRisk, listClientRisks,
  sendDebtReminder, listReminders,
  listFinancialLogs, getPaymentStats,
} from '../controllers/debtsPayments';
import { updateDebtSchema, registerPaymentSchema, updateDebtPrioritySchema, createEscrowSchema, refundEscrowSchema, disputeEscrowSchema, updateClientRiskSchema, sendReminderSchema } from '../validators/debtsPayments';

const router = Router();

router.use(authMiddleware);

// Debts
router.get('/debts', listDebts);
router.get('/debts/:id', getDebt);
router.patch('/debts/:id', validateBody(updateDebtSchema), updateDebt);
router.post('/debts/:id/payment', validateBody(registerPaymentSchema), registerDebtPayment);
router.patch('/debts/:id/priority', validateBody(updateDebtPrioritySchema), updateDebtPriority);

// Escrow
router.post('/escrow', validateBody(createEscrowSchema), createEscrow);
router.get('/escrow', listEscrows);
router.post('/escrow/:id/release', releaseEscrow);
router.post('/escrow/:id/refund', validateBody(refundEscrowSchema), refundEscrow);
router.post('/escrow/:id/dispute', validateBody(disputeEscrowSchema), disputeEscrow);

// Client Risk
router.get('/client-risks', listClientRisks);
router.get('/client-risks/lookup', getClientRisk);
router.patch('/client-risks/:id', validateBody(updateClientRiskSchema), updateClientRisk);

// Reminders
router.post('/debts/:debtId/reminder', validateBody(sendReminderSchema), sendDebtReminder);
router.get('/reminders', listReminders);

// Financial Log
router.get('/logs', listFinancialLogs);

// Stats
router.get('/stats', getPaymentStats);

export default router;
