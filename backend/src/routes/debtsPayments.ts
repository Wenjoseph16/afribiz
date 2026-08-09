import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  listDebts,
  getDebt,
  updateDebt,
  deleteDebtCtrl,
  registerDebtPayment,
  updateDebtPriority,
  createEscrow,
  releaseEscrow,
  refundEscrow,
  disputeEscrow,
  listEscrows,
  getClientRisk,
  updateClientRisk,
  listClientRisks,
  sendDebtReminder,
  listReminders,
  listFinancialLogs,
  getPaymentStats,
  getDebtAging,
  autoScoreClientRisk,
  escalateOverdueDebts,
  autoSendDebtReminders,
} from '../controllers/debtsPayments';
import {
  updateDebtSchema,
  registerPaymentSchema,
  updateDebtPrioritySchema,
  createEscrowSchema,
  refundEscrowSchema,
  disputeEscrowSchema,
  updateClientRiskSchema,
  sendReminderSchema,
} from '../validators/debtsPayments';

const router = Router();

router.use(authMiddleware);

const businessGuard = requireRole(['BUSINESS', 'ADMIN']);

// Auto-scoring & escalation
router.post('/auto-score', businessGuard, autoScoreClientRisk);
router.post('/escalate', businessGuard, escalateOverdueDebts);
router.post('/auto-remind', businessGuard, autoSendDebtReminders);

// Debts
router.get('/debts', businessGuard, listDebts);
router.get('/debts/:id', businessGuard, getDebt);
router.patch('/debts/:id', businessGuard, validateBody(updateDebtSchema), updateDebt);
router.delete('/debts/:id', businessGuard, deleteDebtCtrl);
router.post(
  '/debts/:id/payment',
  businessGuard,
  validateBody(registerPaymentSchema),
  registerDebtPayment
);
router.patch(
  '/debts/:id/priority',
  businessGuard,
  validateBody(updateDebtPrioritySchema),
  updateDebtPriority
);

// Escrow
router.post('/escrow', businessGuard, validateBody(createEscrowSchema), createEscrow);
router.get('/escrow', businessGuard, listEscrows);
router.post('/escrow/:id/release', businessGuard, releaseEscrow);
router.post('/escrow/:id/refund', businessGuard, validateBody(refundEscrowSchema), refundEscrow);
router.post('/escrow/:id/dispute', businessGuard, validateBody(disputeEscrowSchema), disputeEscrow);

// Client Risk
router.get('/client-risks', businessGuard, listClientRisks);
router.get('/client-risks/lookup', businessGuard, getClientRisk);
router.patch(
  '/client-risks/:id',
  businessGuard,
  validateBody(updateClientRiskSchema),
  updateClientRisk
);

// Reminders
router.post(
  '/debts/:debtId/reminder',
  businessGuard,
  validateBody(sendReminderSchema),
  sendDebtReminder
);
router.get('/reminders', businessGuard, listReminders);

// Financial Log
router.get('/logs', businessGuard, listFinancialLogs);

// Stats
router.get('/stats', businessGuard, getPaymentStats);
router.get('/aging', businessGuard, getDebtAging);

export default router;
