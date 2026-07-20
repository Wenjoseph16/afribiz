import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import {
  listLeaves,
  getLeave,
  createLeave,
  updateLeaveStatus,
  deleteLeave,
  getLeaveStats,
} from '../controllers/employeeLeaves';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

router.get('/stats', getLeaveStats);
router.get('/', listLeaves);
router.get('/:id', getLeave);
router.post('/', createLeave);
router.patch('/:id/status', updateLeaveStatus);
router.delete('/:id', deleteLeave);

export default router;
