import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  createAlert,
  updateAlert,
  deleteAlert,
  listAlerts,
  getAlert,
} from '../controllers/alertController';

const router = Router();

router.get('/', authMiddleware, listAlerts);
router.post('/', authMiddleware, createAlert);
router.get('/:id', authMiddleware, getAlert);
router.put('/:id', authMiddleware, updateAlert);
router.patch('/:id', authMiddleware, updateAlert);
router.delete('/:id', authMiddleware, deleteAlert);

export default router;
