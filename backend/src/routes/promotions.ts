import { Router } from 'express';
import { authMiddleware, requireEmployeePermission } from '../middlewares/auth';
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
// Permission VIEW_ORDERS pour les opérations promo (le boss a toujours accès)
router.post(
  '/',
  requireEmployeePermission(['VIEW_ORDERS']),
  validateBody(createPromotionSchema),
  createPromotion
);
router.patch(
  '/:id',
  requireEmployeePermission(['VIEW_ORDERS']),
  validateBody(updatePromotionSchema),
  updatePromotion
);
router.delete('/:id', requireEmployeePermission(['VIEW_ORDERS']), deletePromotion);
router.post(
  '/coupons',
  requireEmployeePermission(['VIEW_ORDERS']),
  validateBody(createCouponSchema),
  createCoupon
);
router.post(
  '/bundles',
  requireEmployeePermission(['VIEW_ORDERS']),
  validateBody(createBundleSchema),
  createBundle
);
router.post(
  '/campaigns',
  requireEmployeePermission(['VIEW_ORDERS']),
  validateBody(createCampaignSchema),
  createCampaign
);
router.post(
  '/campaigns/:id/send-whatsapp',
  requireEmployeePermission(['VIEW_ORDERS']),
  sendCampaignWhatsApp
);
router.put(
  '/loyalty/program',
  requireEmployeePermission(['VIEW_ORDERS']),
  validateBody(updateLoyaltySchema),
  updateLoyaltyProgram
);

export default router;
