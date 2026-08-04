import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  setup2FA,
  verify2FA,
  disable2FA,
  get2FAStatus,
  regenerateRecoveryCodes,
} from '../controllers/twoFactorController';

const router = Router();

router.get('/status', authMiddleware, get2FAStatus);
router.post('/setup', authMiddleware, setup2FA);
router.post('/verify', authMiddleware, verify2FA);
router.post('/disable', authMiddleware, disable2FA);
router.post('/recovery-codes', authMiddleware, regenerateRecoveryCodes);

export default router;
