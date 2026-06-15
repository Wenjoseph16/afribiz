import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { setup2FA, verify2FA, disable2FA, get2FAStatus } from '../controllers/twoFactorController';

const router = Router();

router.get('/status', authMiddleware, get2FAStatus);
router.post('/setup', authMiddleware, setup2FA);
router.post('/verify', authMiddleware, verify2FA);
router.post('/disable', authMiddleware, disable2FA);

export default router;
