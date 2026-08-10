import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import * as adsController from '../controllers/ads';
import * as validators from '../validators/ads';

const router = Router();

// Routes publiques
router.get('/active', adsController.getActiveAds);
router.get('/slots', adsController.getSlots);
router.post(
  '/track/impression',
  validateBody(validators.trackImpressionSchema),
  adsController.trackImpression
);
router.post('/track/click', validateBody(validators.trackClickSchema), adsController.trackClick);
router.post(
  '/track/conversion',
  validateBody(validators.trackConversionSchema),
  adsController.trackConversion
);

// Routes utilisateur (annonceur)
router.post('/report', authMiddleware, adsController.reportAd);
router.get('/', authMiddleware, adsController.getMyCampaigns);
router.get('/my-campaigns', authMiddleware, adsController.getMyCampaigns);
router.post('/campaigns', authMiddleware, adsController.createCampaign);
router.get('/campaigns/:id', authMiddleware, adsController.getCampaignById);
router.get('/campaigns/:id/stats', authMiddleware, adsController.getAdStats);
router.post('/campaigns/:id/invoice', authMiddleware, adsController.generateInvoice);
// Routes admin (complément de celles dans admin.ts)
// IMPORTANT: les routes admin DOIVENT être avant les routes /:id pour éviter
// que Express n'intercepte /admin/* avec le paramètre :id
router.get(
  '/admin/campaigns',
  authMiddleware,
  requireRole(['ADMIN']),
  adsController.adminGetAllCampaigns
);
router.get('/admin/stats', authMiddleware, requireRole(['ADMIN']), adsController.adminGetStats);
router.get('/admin/revenue', authMiddleware, requireRole(['ADMIN']), adsController.adminGetRevenue);
router.get(
  '/admin/packages',
  authMiddleware,
  requireRole(['ADMIN']),
  adsController.adminGetPackages
);
router.post(
  '/admin/packages',
  authMiddleware,
  requireRole(['ADMIN']),
  validateBody(validators.createPackageSchema),
  adsController.adminCreatePackage
);
router.put(
  '/admin/packages/:id',
  authMiddleware,
  requireRole(['ADMIN']),
  validateBody(validators.updatePackageSchema),
  adsController.adminUpdatePackage
);
router.patch(
  '/admin/:id/validate',
  authMiddleware,
  requireRole(['ADMIN']),
  validateBody(validators.validateCampaignSchema),
  adsController.adminValidateCampaign
);
router.patch(
  '/admin/:id/reject',
  authMiddleware,
  requireRole(['ADMIN']),
  validateBody(validators.rejectCampaignSchema),
  adsController.adminRejectCampaign
);
router.patch(
  '/admin/:id/suspend',
  authMiddleware,
  requireRole(['ADMIN']),
  validateBody(validators.suspendCampaignSchema),
  adsController.adminSuspendCampaign
);

// Routes utilisateur (annonceur)
// ATTENTION: les routes /:id doivent être APRÈS les routes admin
router.post('/:id/invoice', authMiddleware, adsController.generateInvoice);
router.patch('/:id/pause', authMiddleware, adsController.pauseCampaign);
router.patch('/:id/resume', authMiddleware, adsController.resumeCampaign);
router.get('/:id', authMiddleware, adsController.getCampaignById);
router.put('/:id', authMiddleware, adsController.updateCampaign);
router.delete('/:id', authMiddleware, adsController.deleteCampaign);

export default router;
