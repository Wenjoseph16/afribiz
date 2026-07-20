import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { partnerAuthMiddleware } from '../middlewares/partnerAuth';
import { cacheResponse } from '../middlewares/cacheMiddleware';
import {
  updateConsentSchema,
  createPartnerSchema,
  updatePartnerSchema,
} from '../validators/afriScore';
import * as afriScoreController from '../controllers/afriScoreController';

const router = Router();

// ============ PUBLIC (BUSINESS AUTH) ============
router.get(
  '/afriscore/mine',
  authMiddleware,
  requireRole(['BUSINESS']),
  cacheResponse({ prefix: 'afriscore-mine', ttl: 120_000 }),
  afriScoreController.getMyScore
);
router.get(
  '/afriscore/mine/history',
  authMiddleware,
  requireRole(['BUSINESS']),
  cacheResponse({ prefix: 'afriscore-history', ttl: 300_000 }),
  afriScoreController.getMyScoreHistory
);
router.get(
  '/afriscore/mine/badges',
  authMiddleware,
  requireRole(['BUSINESS']),
  cacheResponse({ prefix: 'afriscore-badges', ttl: 120_000 }),
  afriScoreController.getMyBadges
);
router.get(
  '/afriscore/mine/benchmark',
  authMiddleware,
  requireRole(['BUSINESS']),
  cacheResponse({ prefix: 'afriscore-benchmark', ttl: 300_000 }),
  afriScoreController.getMyBenchmark
);
router.post(
  '/afriscore/mine/recompute',
  authMiddleware,
  requireRole(['BUSINESS']),
  afriScoreController.recomputeMyScore
);

// ============ CONSENT ============
router.get(
  '/afriscore/consent',
  authMiddleware,
  requireRole(['BUSINESS']),
  afriScoreController.getConsent
);
router.put(
  '/afriscore/consent',
  authMiddleware,
  requireRole(['BUSINESS']),
  validateBody(updateConsentSchema),
  afriScoreController.updateConsent
);
router.post(
  '/afriscore/consent',
  authMiddleware,
  requireRole(['BUSINESS']),
  validateBody(updateConsentSchema),
  afriScoreController.updateConsent
);
router.delete(
  '/afriscore/consent',
  authMiddleware,
  requireRole(['BUSINESS']),
  afriScoreController.deleteConsent
);

// ============ PUBLIC (NO AUTH) ============
router.get('/afriscore/:businessId', afriScoreController.getPublicScore);

// ============ PROTECTED (ANY AUTH) ============
router.get(
  '/afriscore/public/:businessId',
  authMiddleware,
  cacheResponse({ prefix: 'afriscore-public', ttl: 120_000 }),
  afriScoreController.getPublicScore
);

// ============ PARTNER API (API KEY AUTH) ============
router.get(
  '/afriscore/partner/business/:businessId',
  partnerAuthMiddleware,
  cacheResponse({ prefix: 'afriscore-partner-business', ttl: 120_000 }),
  afriScoreController.partnerGetBusinessScore
);
router.get(
  '/afriscore/partner/report/:businessId',
  partnerAuthMiddleware,
  cacheResponse({ prefix: 'afriscore-partner-report', ttl: 300_000 }),
  afriScoreController.partnerGenerateReport
);
router.get(
  '/afriscore/partner/sector/:sector',
  partnerAuthMiddleware,
  cacheResponse({ prefix: 'afriscore-partner-sector', ttl: 3600_000 }),
  afriScoreController.partnerGetSectorReport
);

// ============ DATA HUB ============
router.get(
  '/afriscore/hub/overview',
  authMiddleware,
  cacheResponse({ prefix: 'afriscore-hub-overview', ttl: 300_000 }),
  afriScoreController.getHubOverview
);
router.get(
  '/afriscore/hub/sectors',
  authMiddleware,
  cacheResponse({ prefix: 'afriscore-hub-sectors', ttl: 300_000 }),
  afriScoreController.getHubSectors
);
router.get(
  '/afriscore/hub/geographic',
  authMiddleware,
  cacheResponse({ prefix: 'afriscore-hub-geographic', ttl: 300_000 }),
  afriScoreController.getHubGeographic
);
router.get(
  '/afriscore/hub/trends',
  authMiddleware,
  cacheResponse({ prefix: 'afriscore-hub-trends', ttl: 300_000 }),
  afriScoreController.getHubTrends
);
router.get(
  '/afriscore/hub/payments',
  authMiddleware,
  cacheResponse({ prefix: 'afriscore-hub-payments', ttl: 300_000 }),
  afriScoreController.getHubPayments
);

// ============ ADMIN ============
router.get(
  '/afriscore/admin/partners',
  authMiddleware,
  requireRole(['ADMIN']),
  cacheResponse({ prefix: 'afriscore-admin-partners', ttl: 120_000 }),
  afriScoreController.adminListPartners
);
router.post(
  '/afriscore/admin/partners',
  authMiddleware,
  requireRole(['ADMIN']),
  validateBody(createPartnerSchema),
  afriScoreController.adminCreatePartner
);
router.put(
  '/afriscore/admin/partners/:id',
  authMiddleware,
  requireRole(['ADMIN']),
  validateBody(updatePartnerSchema),
  afriScoreController.adminUpdatePartner
);
router.delete(
  '/afriscore/admin/partners/:id',
  authMiddleware,
  requireRole(['ADMIN']),
  afriScoreController.adminDeactivatePartner
);
router.get(
  '/afriscore/admin/reports',
  authMiddleware,
  requireRole(['ADMIN']),
  cacheResponse({ prefix: 'afriscore-admin-reports', ttl: 300_000 }),
  afriScoreController.adminListReports
);
router.get(
  '/afriscore/admin/access-logs',
  authMiddleware,
  requireRole(['ADMIN']),
  cacheResponse({ prefix: 'afriscore-admin-access-logs', ttl: 120_000 }),
  afriScoreController.adminAccessLogs
);
router.get(
  '/afriscore/admin/subscriptions',
  authMiddleware,
  requireRole(['ADMIN']),
  cacheResponse({ prefix: 'afriscore-admin-subscriptions', ttl: 120_000 }),
  afriScoreController.adminSubscriptions
);
router.post(
  '/afriscore/admin/recompute',
  authMiddleware,
  requireRole(['ADMIN']),
  afriScoreController.adminRecompute
);
router.get(
  '/afriscore/admin/revenue',
  authMiddleware,
  requireRole(['ADMIN']),
  cacheResponse({ prefix: 'afriscore-admin-revenue', ttl: 120_000 }),
  afriScoreController.adminRevenue
);

export default router;
