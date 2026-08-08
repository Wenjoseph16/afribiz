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
  sendCampaignWhatsApp,
  getLoyaltyProgram,
  updateLoyaltyProgram,
  getClientLoyalty,
  getPromoStats,
} from '../controllers/promotions';

const router = Router();

router.use(authMiddleware);

// ─── Routes publiques (lecture) ───
// Accessible à tous les utilisateurs authentifiés (CLIENT, BUSINESS, ADMIN)
// ATTENTION: les routes statiques (coupons, bundles, campaigns, loyalty, stats)
// doivent être déclarées AVANT '/:id', sinon Express matche '/:id' en premier
// et toutes ces listes renvoient un 404 (id = 'campaigns' introuvable).
router.get('/', listPromotions);
router.get('/coupons', listCoupons);
router.get('/bundles', listBundles);
router.get('/campaigns', listCampaigns);
router.get('/loyalty/program', getLoyaltyProgram);
router.get('/loyalty/clients/:clientId', getClientLoyalty);
router.get('/stats', getPromoStats);
router.get('/:id', getPromotion);

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
router.post(
  '/campaigns/:id/send-whatsapp',
  requireRole(['BUSINESS', 'ADMIN']),
  sendCampaignWhatsApp
);
router.put(
  '/loyalty/program',
  requireRole(['BUSINESS', 'ADMIN']),
  validateBody(updateLoyaltySchema),
  updateLoyaltyProgram
);

export default router;
