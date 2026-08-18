import { Router } from 'express';
import { authMiddleware, requireEmployeePermission } from '../middlewares/auth';
import {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getAccountingStats,
  getMonthlyReportCtrl,
  getAccountingSummaryCtrl,
  getRecentTransactionsCtrl,
} from '../controllers/accounting';

const router = Router();
router.use(authMiddleware, requireEmployeePermission(['ACCESS_FINANCES']));

router.get('/summary', getAccountingSummaryCtrl);
router.get('/transactions', getRecentTransactionsCtrl);
router.get('/stats', getAccountingStats);
router.get('/report', getMonthlyReportCtrl);
router.get('/', listExpenses);
router.get('/:id', getExpense);
router.post('/', createExpense);
router.patch('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
