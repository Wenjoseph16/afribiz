import { Router, Response } from 'express';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import { prisma } from '../lib/db';
import {
  activateDeveloperRole,
  getMyDeveloperProfile,
  updateDeveloperProfile,
  submitVerification,
  getDeveloperDashboard,
  getPublicDeveloperProfile,
} from '../controllers/developer';
import {
  createModule,
  updateModule,
  publishModule,
  archiveModule,
  getDeveloperModules,
  getModuleById,
  getModuleBySlug,
  getMarketplaceModules,
  installModule,
  uninstallModule,
  purchaseModule,
  startTrial,
  confirmModulePayment,
  createModuleVersion,
  getModuleVersions,
  uploadModuleImages,
  createReview,
  getModuleReviews,
  respondToReview,
  createTicket,
  getMyTickets,
  getTicketById,
  replyToTicket,
  updateTicketStatus,
  getInstallations,
  getOrders,
  getSubscriptions,
  getRevenueHistory,
  getRevenueSummary,
  getPayoutHistory,
  requestPayout,
} from '../controllers/developerModules';
import { uploadFields } from '../middlewares/upload';
import {
  getModulePermissions,
  addModulePermission,
  removeModulePermission,
  checkModulePermissions,
  getPermissionSummary,
  createLicense,
  activateLicense,
  revokeLicense,
  renewLicense,
  checkLicense,
  getModuleLicenses,
  getBusinessLicenses,
  getLicenseStats,
  createApiKey,
  getApiKeys,
  revokeApiKey,
  createWebhook,
  getWebhooks,
  deleteWebhook,
  getWebhookDeliveries,
  trackAnalytics,
  getModuleAnalytics,
  logModuleError,
  getModuleErrors,
  resolveError,
  submitForValidation,
  approveValidationCheck,
  rejectValidationCheck,
  completeValidation,
  getModuleValidation,
  getPendingValidations,
  getValidationHistory,
  saveModuleConfiguration,
  getModuleConfiguration,
  toggleModuleActive,
  getModuleConfigurations,
  getBusinessModules,
  logActivity,
  getModuleActivity,
  getDeveloperActivityFeed,
  getBusinessActivityFeed,
  getActivityStats,
  getDeveloperAnalyticsOverview,
} from '../controllers/developerModulesExtended';
import {
  updateProfileSchema,
  submitVerificationSchema,
  createModuleSchema,
  updateModuleSchema,
  createVersionSchema,
  createReviewSchema,
  createTicketSchema,
  replyTicketSchema,
  requestPayoutSchema,
  updateTicketStatusSchema,
} from '../validators/developer';

const router = Router();

const developerMiddleware = requireRole(['DEVELOPER']);

// ============================================
// DEVELOPER PROFILE ROUTES
// ============================================

router.post('/activate', authMiddleware, activateDeveloperRole);
router.get('/profile', authMiddleware, developerMiddleware, getMyDeveloperProfile);
router.put('/profile', authMiddleware, developerMiddleware, validateBody(updateProfileSchema), updateDeveloperProfile);
router.post('/verification', authMiddleware, developerMiddleware, validateBody(submitVerificationSchema), submitVerification);
router.get('/dashboard', authMiddleware, developerMiddleware, getDeveloperDashboard);
router.get('/public/:id', getPublicDeveloperProfile);

// ============================================
// MODULE MANAGEMENT ROUTES
// ============================================

router.get('/modules', authMiddleware, developerMiddleware, getDeveloperModules);
router.post('/modules', authMiddleware, developerMiddleware, validateBody(createModuleSchema), createModule);
router.get('/modules/:id', authMiddleware, getModuleById);
router.put('/modules/:id', authMiddleware, developerMiddleware, validateBody(updateModuleSchema), updateModule);
router.post('/modules/:id/publish', authMiddleware, developerMiddleware, publishModule);
router.post('/modules/:id/archive', authMiddleware, developerMiddleware, archiveModule);
router.get('/modules/:id/versions', authMiddleware, getModuleVersions);
router.post('/modules/:id/versions', authMiddleware, developerMiddleware, validateBody(createVersionSchema), createModuleVersion);
router.post('/modules/:id/images', authMiddleware, developerMiddleware, uploadFields([{ name: 'logo', maxCount: 1 }, { name: 'screenshots', maxCount: 10 }]), uploadModuleImages);

// Module Media (Stories/Shorts pour promouvoir le module)
router.post('/modules/:id/media', authMiddleware, developerMiddleware, catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { id } = req.params;
  const { mediaUrl, mediaType, caption, linkUrl } = req.body;

  const moduleItem = await prisma.developerModule.findUnique({ where: { id } });
  if (!moduleItem) { res.status(404).json({ success: false, error: 'Module introuvable' }); return; }

  const story = await prisma.story.create({
    data: {
      businessId: moduleItem.developerId,
      mediaType: mediaType || 'IMAGE',
      mediaUrl,
      caption: caption || `Découvrez le module ${moduleItem.name}`,
      linkTargetType: 'CUSTOM_LINK',
      linkTargetId: id,
      linkUrl: linkUrl || null,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    },
    include: { business: { select: { id: true, name: true, slug: true, logo: true } } },
  });

  // Créer un feed item pour le module
  await prisma.feedItem.create({
    data: {
      businessId: moduleItem.developerId,
      type: 'STORY',
      referenceId: story.id,
      mediaUrl,
      title: caption || moduleItem.name,
      description: `Module: ${moduleItem.name}`,
      linkTargetType: 'CUSTOM_LINK',
      linkTargetId: id,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    },
  });

  // Marquer le type pour que le frontend sache que c'est un module
  res.status(201).json(successResponse({ ...story, isModuleMedia: true, moduleId: id, moduleName: moduleItem.name }, 'Média du module créé'));
}));

// ============================================
// MARKETPLACE ROUTES (public access)
// ============================================

router.get('/marketplace/modules', getMarketplaceModules);
router.get('/marketplace/modules/:slug', getModuleBySlug);
router.post('/marketplace/modules/:id/install', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER']), installModule);
router.post('/marketplace/modules/:id/uninstall', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER']), uninstallModule);
router.post('/marketplace/modules/:id/purchase', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER']), purchaseModule);
router.post('/marketplace/modules/:id/trial', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER']), startTrial);
router.post('/marketplace/confirm-payment', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER']), confirmModulePayment);

// ============================================
// MODULE REVIEW ROUTES
// ============================================

router.post('/modules/:id/reviews', authMiddleware, validateBody(createReviewSchema), createReview);
router.get('/modules/:id/reviews', getModuleReviews);
router.put('/reviews/:id/response', authMiddleware, developerMiddleware, respondToReview);

// ============================================
// SUPPORT TICKET ROUTES
// ============================================

router.get('/tickets', authMiddleware, developerMiddleware, getMyTickets);
router.post('/tickets', authMiddleware, developerMiddleware, validateBody(createTicketSchema), createTicket);
router.get('/tickets/:id', authMiddleware, getTicketById);
router.post('/tickets/:id/messages', authMiddleware, validateBody(replyTicketSchema), replyToTicket);
router.put('/tickets/:id/status', authMiddleware, developerMiddleware, validateBody(updateTicketStatusSchema), updateTicketStatus);

// ============================================
// INSTALLATIONS, ORDERS & SUBSCRIPTIONS
// ============================================

router.get('/installations', authMiddleware, developerMiddleware, getInstallations);
router.get('/orders', authMiddleware, developerMiddleware, getOrders);
router.get('/subscriptions', authMiddleware, developerMiddleware, getSubscriptions);

// ============================================
// REVENUE & PAYOUT ROUTES
// ============================================

router.get('/revenues', authMiddleware, developerMiddleware, getRevenueHistory);
router.get('/revenues/summary', authMiddleware, developerMiddleware, getRevenueSummary);
router.get('/payouts', authMiddleware, developerMiddleware, getPayoutHistory);
router.post('/payouts', authMiddleware, developerMiddleware, validateBody(requestPayoutSchema), requestPayout);

// ============================================
// MODULE PERMISSIONS ROUTES
// ============================================

router.get('/modules/:id/permissions', authMiddleware, getModulePermissions);
router.post('/modules/:id/permissions', authMiddleware, developerMiddleware, addModulePermission);
router.delete('/permissions/:id', authMiddleware, developerMiddleware, removeModulePermission);
router.get('/modules/:id/permissions/check', authMiddleware, checkModulePermissions);
router.get('/modules/:id/permissions/summary', authMiddleware, getPermissionSummary);

// ============================================
// LICENSE ROUTES
// ============================================

router.post('/licenses', authMiddleware, developerMiddleware, createLicense);
router.post('/licenses/activate', authMiddleware, activateLicense);
router.post('/licenses/:id/revoke', authMiddleware, developerMiddleware, revokeLicense);
router.post('/licenses/:id/renew', authMiddleware, developerMiddleware, renewLicense);
router.get('/licenses/check', authMiddleware, checkLicense);
router.get('/modules/:id/licenses', authMiddleware, getModuleLicenses);
router.get('/licenses/business/:businessId', authMiddleware, getBusinessLicenses);
router.get('/licenses/stats', authMiddleware, developerMiddleware, getLicenseStats);

// ============================================
// API KEYS ROUTES
// ============================================

router.get('/api-keys', authMiddleware, developerMiddleware, getApiKeys);
router.post('/api-keys', authMiddleware, developerMiddleware, createApiKey);
router.post('/api-keys/:id/revoke', authMiddleware, developerMiddleware, revokeApiKey);

// ============================================
// WEBHOOK ROUTES
// ============================================

router.get('/webhooks', authMiddleware, developerMiddleware, getWebhooks);
router.post('/webhooks', authMiddleware, developerMiddleware, createWebhook);
router.delete('/webhooks/:id', authMiddleware, developerMiddleware, deleteWebhook);
router.get('/webhooks/:id/deliveries', authMiddleware, developerMiddleware, getWebhookDeliveries);

// ============================================
// ANALYTICS & ERROR ROUTES
// ============================================

router.post('/modules/:id/analytics/track', authMiddleware, developerMiddleware, trackAnalytics);
router.get('/modules/:id/analytics', authMiddleware, developerMiddleware, getModuleAnalytics);
router.get('/analytics/overview', authMiddleware, developerMiddleware, getDeveloperAnalyticsOverview);
router.post('/modules/:id/errors', authMiddleware, developerMiddleware, logModuleError);
router.get('/modules/:id/errors', authMiddleware, developerMiddleware, getModuleErrors);
router.post('/errors/:id/resolve', authMiddleware, resolveError);

// ============================================
// VALIDATION ROUTES
// ============================================

router.post('/modules/:id/validation/submit', authMiddleware, developerMiddleware, submitForValidation);
router.get('/modules/:id/validation', authMiddleware, getModuleValidation);
router.get('/modules/:id/validation/history', authMiddleware, getValidationHistory);
router.get('/validations/pending', authMiddleware, requireRole(['ADMIN']), getPendingValidations);
router.post('/validation-checks/:id/approve', authMiddleware, requireRole(['ADMIN']), approveValidationCheck);
router.post('/validation-checks/:id/reject', authMiddleware, requireRole(['ADMIN']), rejectValidationCheck);
router.post('/validations/:id/complete', authMiddleware, requireRole(['ADMIN']), completeValidation);

// ============================================
// CONFIGURATION ROUTES
// ============================================

router.post('/modules/:id/configuration', authMiddleware, developerMiddleware, saveModuleConfiguration);
router.get('/modules/:id/configuration', authMiddleware, developerMiddleware, getModuleConfiguration);
router.put('/modules/:id/configuration/toggle', authMiddleware, developerMiddleware, toggleModuleActive);
router.get('/modules/:id/configurations', authMiddleware, developerMiddleware, getModuleConfigurations);
router.get('/configurations/business/:businessId', authMiddleware, getBusinessModules);

// ============================================
// ACTIVITY LOG ROUTES
// ============================================

router.post('/modules/:id/activity', authMiddleware, developerMiddleware, logActivity);
router.get('/modules/:id/activity', authMiddleware, developerMiddleware, getModuleActivity);
router.get('/modules/:id/activity/stats', authMiddleware, getActivityStats);
router.get('/activity/feed', authMiddleware, developerMiddleware, getDeveloperActivityFeed);
router.get('/activity/business/:businessId', authMiddleware, getBusinessActivityFeed);

export default router;
