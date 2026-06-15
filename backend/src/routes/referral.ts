import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { inviteReferralSchema } from '../validators/referral';
import { getMyReferralCode, inviteReferral, getMyReferrals, getMyReferralRewards, getReferralStats } from '../controllers/referral';

const router = Router();
router.use(authMiddleware);

router.get('/code', getMyReferralCode);
router.post('/invite', validateBody(inviteReferralSchema), inviteReferral);
router.get('/list', getMyReferrals);
router.get('/rewards', getMyReferralRewards);
router.get('/stats', getReferralStats);

export default router;
