import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  createPromotionSchema, updatePromotionSchema,
  createCouponSchema,
  createBundleSchema,
  createCampaignSchema,
  updateLoyaltySchema,
} from '../validators/promotions';
import {
  listPromotions, getPromotion, createPromotion, updatePromotion, deletePromotion,
  listCoupons, createCoupon,
  listBundles, createBundle,
  listCampaigns, createCampaign,
  getLoyaltyProgram, updateLoyaltyProgram, getClientLoyalty,
  getPromoStats,
} from '../controllers/promotions';

const router = Router();

router.use(authMiddleware);

// Coupons (must be before /:id to avoid conflict)
router.get('/coupons', listCoupons);
router.post('/coupons', validateBody(createCouponSchema), createCoupon);

// Bundles
router.get('/bundles', listBundles);
router.post('/bundles', validateBody(createBundleSchema), createBundle);

// Campaigns
router.get('/campaigns', listCampaigns);
router.post('/campaigns', validateBody(createCampaignSchema), createCampaign);

// Loyalty
router.get('/loyalty/program', getLoyaltyProgram);
router.put('/loyalty/program', validateBody(updateLoyaltySchema), updateLoyaltyProgram);
router.get('/loyalty/clients/:clientId', getClientLoyalty);

// Stats
router.get('/stats', getPromoStats);

// Promotions (list & create at root)
router.get('/', listPromotions);
router.post('/', validateBody(createPromotionSchema), createPromotion);

// Single promotion (by ID, must be after all literal routes)
router.get('/:id', getPromotion);
router.patch('/:id', validateBody(updatePromotionSchema), updatePromotion);
router.delete('/:id', deletePromotion);

export default router;
