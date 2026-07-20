import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { cacheResponse } from '../middlewares/cacheMiddleware';
import * as ctrl from '../controllers/adminFinanceController';

const router = Router();
router.use('/admin', authMiddleware, requireRole(['ADMIN']));

router.get(
  '/admin/finance/overview',
  cacheResponse({ prefix: 'admin-finance-overview', ttl: 120_000 }),
  ctrl.getAdminFinanceOverview
);
router.get(
  '/admin/finance/transactions',
  cacheResponse({ prefix: 'admin-finance-transactions', ttl: 60_000 }),
  ctrl.getAdminAllTransactions
);
router.get(
  '/admin/finance/escrows',
  cacheResponse({ prefix: 'admin-finance-escrows', ttl: 60_000 }),
  ctrl.getAdminAllEscrows
);
router.get(
  '/admin/finance/fraud-alerts',
  cacheResponse({ prefix: 'admin-finance-fraud', ttl: 60_000 }),
  ctrl.getAdminFraudAlerts
);
router.get(
  '/admin/finance/debt-recovery',
  cacheResponse({ prefix: 'admin-finance-debt', ttl: 60_000 }),
  ctrl.getAdminDebtRecovery
);

export default router;
