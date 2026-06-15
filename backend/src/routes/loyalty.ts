import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { redeemLoyaltyPoints } from '../controllers/promotions';

const router = Router();
router.use(authMiddleware);

const redeemSchema = z.object({
  businessId: z.string().uuid('Business requis'),
  points: z.number().int().positive('Points requis'),
  rewardTitle: z.string().optional(),
  rewardType: z.enum(['DISCOUNT', 'FREE_ITEM', 'FREE_SHIPPING', 'POINTS_BONUS']).optional(),
});

router.post('/redeem', validateBody(redeemSchema), redeemLoyaltyPoints);

export default router;
