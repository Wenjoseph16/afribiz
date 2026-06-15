import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import * as ctrl from '../controllers/adminFinanceController';

const router = Router();
router.use(authMiddleware);

router.get('/admin/finance/overview', ctrl.getAdminFinanceOverview);
router.get('/admin/finance/transactions', ctrl.getAdminAllTransactions);
router.get('/admin/finance/escrows', ctrl.getAdminAllEscrows);
router.get('/admin/finance/fraud-alerts', ctrl.getAdminFraudAlerts);
router.get('/admin/finance/debt-recovery', ctrl.getAdminDebtRecovery);

export default router;
