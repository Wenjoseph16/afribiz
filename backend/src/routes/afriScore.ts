import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { partnerAuthMiddleware } from '../middlewares/partnerAuth';
import { updateConsentSchema, createPartnerSchema, updatePartnerSchema } from '../validators/afriScore';
import * as afriScoreController from '../controllers/afriScoreController';

const router = Router();

// ============ PUBLIC (BUSINESS AUTH) ============
router.get('/afriscore/mine', authMiddleware, requireRole(['BUSINESS']), afriScoreController.getMyScore);
router.get('/afriscore/mine/history', authMiddleware, requireRole(['BUSINESS']), afriScoreController.getMyScoreHistory);
router.get('/afriscore/mine/badges', authMiddleware, requireRole(['BUSINESS']), afriScoreController.getMyBadges);
router.get('/afriscore/mine/benchmark', authMiddleware, requireRole(['BUSINESS']), afriScoreController.getMyBenchmark);
router.post('/afriscore/mine/recompute', authMiddleware, requireRole(['BUSINESS']), afriScoreController.recomputeMyScore);

// ============ PROTECTED (ANY AUTH) ============
router.get('/afriscore/public/:businessId', authMiddleware, afriScoreController.getPublicScore);

// ============ PARTNER API (API KEY AUTH) ============
router.get('/afriscore/partner/business/:businessId', partnerAuthMiddleware, afriScoreController.partnerGetBusinessScore);
router.get('/afriscore/partner/report/:businessId', partnerAuthMiddleware, afriScoreController.partnerGenerateReport);
router.get('/afriscore/partner/sector/:sector', partnerAuthMiddleware, afriScoreController.partnerGetSectorReport);

// ============ DATA HUB ============
router.get('/afriscore/hub/overview', authMiddleware, afriScoreController.getHubOverview);
router.get('/afriscore/hub/sectors', authMiddleware, afriScoreController.getHubSectors);
router.get('/afriscore/hub/geographic', authMiddleware, afriScoreController.getHubGeographic);
router.get('/afriscore/hub/trends', authMiddleware, afriScoreController.getHubTrends);
router.get('/afriscore/hub/payments', authMiddleware, afriScoreController.getHubPayments);

// ============ CONSENT ============
router.get('/afriscore/consent', authMiddleware, requireRole(['BUSINESS']), afriScoreController.getConsent);
router.put('/afriscore/consent', authMiddleware, requireRole(['BUSINESS']), validateBody(updateConsentSchema), afriScoreController.updateConsent);
router.post('/afriscore/consent', authMiddleware, requireRole(['BUSINESS']), validateBody(updateConsentSchema), afriScoreController.updateConsent);
router.delete('/afriscore/consent', authMiddleware, requireRole(['BUSINESS']), afriScoreController.deleteConsent);

// ============ ADMIN ============
router.get('/afriscore/admin/partners', authMiddleware, requireRole(['ADMIN']), afriScoreController.adminListPartners);
router.post('/afriscore/admin/partners', authMiddleware, requireRole(['ADMIN']), validateBody(createPartnerSchema), afriScoreController.adminCreatePartner);
router.put('/afriscore/admin/partners/:id', authMiddleware, requireRole(['ADMIN']), validateBody(updatePartnerSchema), afriScoreController.adminUpdatePartner);
router.delete('/afriscore/admin/partners/:id', authMiddleware, requireRole(['ADMIN']), afriScoreController.adminDeactivatePartner);
router.get('/afriscore/admin/reports', authMiddleware, requireRole(['ADMIN']), afriScoreController.adminListReports);
router.get('/afriscore/admin/access-logs', authMiddleware, requireRole(['ADMIN']), afriScoreController.adminAccessLogs);
router.get('/afriscore/admin/subscriptions', authMiddleware, requireRole(['ADMIN']), afriScoreController.adminSubscriptions);
router.post('/afriscore/admin/recompute', authMiddleware, requireRole(['ADMIN']), afriScoreController.adminRecompute);
router.get('/afriscore/admin/revenue', authMiddleware, requireRole(['ADMIN']), afriScoreController.adminRevenue);

export default router;
