import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  connectAccount,
  disconnectAccount,
  listAccounts,
  updateShareSettings,
} from '../controllers/socialAccountController';

const router = Router();

router.get('/', authMiddleware, listAccounts);
router.post('/connect', authMiddleware, connectAccount);
router.put('/:id/settings', authMiddleware, updateShareSettings);
router.patch('/:id/settings', authMiddleware, updateShareSettings);
router.delete('/:id', authMiddleware, disconnectAccount);

export default router;
