import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  createReport,
  getReports,
  getReportById,
  resolveReport,
  getReportCounts,
} from '../controllers/contentReportController';

const router = Router();

router.post('/', authMiddleware, createReport);
router.get('/', authMiddleware, getReports);
router.get('/counts', authMiddleware, getReportCounts);
router.get('/:id', authMiddleware, getReportById);
router.patch('/:id/resolve', authMiddleware, resolveReport);

export default router;
