import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import {
  listPayrolls,
  getPayroll,
  createPayroll,
  updatePayrollStatus,
  deletePayroll,
  getPayrollStats,
} from '../controllers/payrollController';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

router.get('/stats', getPayrollStats);
router.get('/', listPayrolls);
router.get('/:id', getPayroll);
router.post('/', createPayroll);
router.patch('/:id/status', updatePayrollStatus);
router.delete('/:id', deletePayroll);

export default router;
