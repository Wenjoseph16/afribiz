import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { getMarketingStats, triggerBirthdayCampaign, triggerInactiveCheck } from '../controllers/marketing';

const router = Router();
router.use(authMiddleware);

router.get('/stats', getMarketingStats);
router.post('/birthday', triggerBirthdayCampaign);
router.post('/inactive-check', triggerInactiveCheck);

export default router;
