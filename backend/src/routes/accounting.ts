import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  listExpenses, getExpense, createExpense, updateExpense, deleteExpense,
  getAccountingStats, getMonthlyReportCtrl,
} from '../controllers/accounting';

const router = Router();
router.use(authMiddleware);

router.get('/stats', getAccountingStats);
router.get('/report', getMonthlyReportCtrl);
router.get('/', listExpenses);
router.get('/:id', getExpense);
router.post('/', createExpense);
router.patch('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
