import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { getBalanceSheetCtrl, getIncomeStatementCtrl, exportAccountingCSVCtrl } from '../controllers/accountingAdvanced';

const router = Router();
router.use(authMiddleware);

router.get('/balance-sheet', getBalanceSheetCtrl);
router.get('/income-statement', getIncomeStatementCtrl);
router.get('/export-csv', exportAccountingCSVCtrl);

export default router;
