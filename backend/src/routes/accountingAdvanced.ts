import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import {
  getBalanceSheetCtrl,
  getIncomeStatementCtrl,
  exportAccountingCSVCtrl,
} from '../controllers/accountingAdvanced';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

router.get('/balance-sheet', getBalanceSheetCtrl);
router.get('/income-statement', getIncomeStatementCtrl);
router.get('/export-csv', exportAccountingCSVCtrl);

export default router;
