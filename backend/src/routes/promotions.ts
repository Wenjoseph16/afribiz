import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  createPromotionSchema,
  updatePromotionSchema,
  createCouponSchema,
  createBundleSchema,
  createCampaignSchema,
  updateLoyaltySchema,
} from '../validators/promotions';
import {
  listPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  listCoupons,
  createCoupon,
  listBundles,
  createBundle,
  listCampaigns,
  createCampaign,
  getLoyaltyProgram,
  updateLoyaltyProgram,
  getClientLoyalty,
  getPromoStats,
} from '../controllers/promotions';

const router = Router();

router.use(authMiddleware);

// ─── Routes publiques (lecture) ───
// Accessible à tous les utilisateurs authentifiés (CLIENT, BUSINESS, ADMIN)
router.get('/', listPromotions);
router.get('/:id', getPromotion);
router.get('/coupons', listCoupons);
router.get('/bundles', listBundles);
router.get('/campaigns', listCampaigns);
router.get('/loyalty/program', getLoyaltyProgram);
router.get('/loyalty/clients/:clientId', getClientLoyalty);
router.get('/stats', getPromoStats);

// ─── Routes protégées (écriture) ───
// Réservé aux BUSINESS et ADMIN
router.post(
  '/',
  requireRole(['BUSINESS', 'ADMIN']),
  validateBody(createPromotionSchema),
  createPromotion
);
router.patch(
  '/:id',
  requireRole(['BUSINESS', 'ADMIN']),
  validateBody(updatePromotionSchema),
  updatePromotion
);
router.delete('/:id', requireRole(['BUSINESS', 'ADMIN']), deletePromotion);
router.post(
  '/coupons',
  requireRole(['BUSINESS', 'ADMIN']),
  validateBody(createCouponSchema),
  createCoupon
);
router.post(
  '/bundles',
  requireRole(['BUSINESS', 'ADMIN']),
  validateBody(createBundleSchema),
  createBundle
);
router.post(
  '/campaigns',
  requireRole(['BUSINESS', 'ADMIN']),
  validateBody(createCampaignSchema),
  createCampaign
);
router.put(
  '/loyalty/program',
  requireRole(['BUSINESS', 'ADMIN']),
  validateBody(updateLoyaltySchema),
  updateLoyaltyProgram
);

export default router;
