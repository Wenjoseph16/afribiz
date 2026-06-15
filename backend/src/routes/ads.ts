import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import * as adsController from '../controllers/ads';
import * as validators from '../validators/ads';

const router = Router();

router.get('/active', adsController.getActiveAds);
router.post('/track/impression', validateBody(validators.trackImpressionSchema), adsController.trackImpression);
router.post('/track/click', validateBody(validators.trackClickSchema), adsController.trackClick);
router.post('/report', authMiddleware, adsController.reportAd);

router.get('/admin/campaigns', authMiddleware, requireRole(['ADMIN']), adsController.adminGetAllCampaigns);
router.get('/admin/stats', authMiddleware, requireRole(['ADMIN']), adsController.adminGetStats);
router.get('/admin/revenue', authMiddleware, requireRole(['ADMIN']), adsController.adminGetRevenue);
router.get('/admin/packages', authMiddleware, requireRole(['ADMIN']), adsController.adminGetPackages);
router.post('/admin/packages', authMiddleware, requireRole(['ADMIN']), validateBody(validators.createPackageSchema), adsController.adminCreatePackage);
router.put('/admin/packages/:id', authMiddleware, requireRole(['ADMIN']), validateBody(validators.updatePackageSchema), adsController.adminUpdatePackage);
router.patch('/admin/:id/validate', authMiddleware, requireRole(['ADMIN']), validateBody(validators.validateCampaignSchema), adsController.adminValidateCampaign);
router.patch('/admin/:id/reject', authMiddleware, requireRole(['ADMIN']), validateBody(validators.rejectCampaignSchema), adsController.adminRejectCampaign);
router.patch('/admin/:id/suspend', authMiddleware, requireRole(['ADMIN']), validateBody(validators.suspendCampaignSchema), adsController.adminSuspendCampaign);

router.post('/', authMiddleware, validateBody(validators.createCampaignSchema), adsController.createCampaign);
router.get('/', authMiddleware, adsController.getMyCampaigns);
router.get('/:id', authMiddleware, adsController.getCampaignById);
router.get('/:id/stats', authMiddleware, adsController.getAdStats);
router.post('/:id/invoice', authMiddleware, adsController.generateInvoice);
router.put('/:id', authMiddleware, adsController.updateCampaign);
router.patch('/:id/pause', authMiddleware, adsController.pauseCampaign);
router.patch('/:id/resume', authMiddleware, adsController.resumeCampaign);
router.delete('/:id', authMiddleware, adsController.deleteCampaign);

export default router;
