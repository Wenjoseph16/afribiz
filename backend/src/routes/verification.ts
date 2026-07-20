import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getVerification,
  upgradeToOr,
  upgradeToPlatine,
} from '../controllers/verificationController';

const router = express.Router();

router.get('/', authMiddleware, getVerification);
router.post('/upgrade/or', authMiddleware, upgradeToOr);
router.post('/upgrade/platine', authMiddleware, upgradeToPlatine);

export default router;
