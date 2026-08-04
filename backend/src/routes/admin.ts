import express, { Router, Response } from 'express';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { adminLimiter } from '../middlewares/rateLimiter';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import { prisma } from '../lib/db';
import {
  updateUserStatusSchema,
  updateBusinessStatusSchema,
  updateBusinessVerificationSchema,
  updateDeveloperStatusSchema,
  updateModuleStatusSchema,
  arbitrateEscrowSchema,
  blockIpSchema,
  rejectAdCampaignSchema as rejectAdSchema,
  suspendAdCampaignSchema as suspendAdSchema,
} from '../validators/admin';
import { recalculateBusinessRating } from '../services/business';
import {
  getDashboardStats,
  getUsers,
  getPresence,
  getUserById,
  updateUserStatus,
  getUserActivity,
  getBusinesses,
  getBusinessById,
  updateBusinessStatus,
  updateBusinessVerification,
  updateBusinessPlan,
  getDevelopers,
  getDeveloperById,
  updateDeveloperStatus,
  getModules,
  updateModuleStatus,
  getPayments,
  getEscrows,
  getSubscriptions,
  getSupportTickets,
  getDisputes,
  getDataReports,
  getNotifications,
  getSecurityLogs,
  getSystemLogs,
  getApiKeys,
  getFraudReports,
  getAdminAuditLog,
  // NEW CONTROLLERS
  getAdminEscrows,
  getAdminEscrowStats,
  releaseAdminEscrow,
  refundAdminEscrow,
  arbitrateAdminEscrow,
  getAdminPaymentStats,
  validatePayment,
  refundPayment,
  getAdminSubscriptionStats,
  cancelAdminSubscription,
  renewAdminSubscription,
  getAdminSecurityStats,
  getAdminSecurityAdmins,
  getAdminSecuritySessions,
  revokeAdminSession,
  getAdminSecurityAttempts,
  getAdminSecurityBlacklist,
  blockAdminSecurityIp,
  unblockAdminSecurityIp,
  getAdminSecurityJournal,
  getDisputesStats,
  updateDisputeStatus,
  getAdminMarketplaceItems,
  updateAdminMarketplaceItem,
  getAdminAdCampaigns,
  getAdminAdStats,
  getAdminAdRevenue,
  validateAdminAdCampaign,
  rejectAdminAdCampaign,
  suspendAdminAdCampaign,
  getAdminAfriScoreStats,
  getAdminAfriScoreBadges,
  getAdminAfriScoreHistory,
  getAdminAfriScoreAudit,
  getAdminPartners,
  approveAdminPartner,
  suspendAdminPartner,
  revokeAdminPartner,
  getAdminDataAccessLogs,
  getAdminPlatformAnalytics,
  getAllPayouts,
  approvePayout,
  rejectPayout,
} from '../controllers/adminController';
import * as adminFeaturesController from '../controllers/adminFeaturesController';
import * as moduleDemandController from '../controllers/moduleDemandController';

const router: Router = express.Router();

// All admin routes require authentication and ADMIN role
router.use('/admin', authMiddleware, requireRole(['ADMIN']), adminLimiter);

// Dashboard
router.get('/admin/dashboard/stats', getDashboardStats);

// Users management
router.get('/admin/users', getUsers);
router.get('/admin/presence', getPresence);
router.get('/admin/users/:id', getUserById);
router.put('/admin/users/:id/status', validateBody(updateUserStatusSchema), updateUserStatus);
router.get('/admin/users/:id/activity', getUserActivity);

// Businesses management
router.get('/admin/businesses', getBusinesses);
router.get('/admin/businesses/:id', getBusinessById);
router.put(
  '/admin/businesses/:id/status',
  validateBody(updateBusinessStatusSchema),
  updateBusinessStatus
);
router.put(
  '/admin/businesses/:id/verification',
  validateBody(updateBusinessVerificationSchema),
  updateBusinessVerification
);
router.put('/admin/businesses/:id/plan', updateBusinessPlan);

// Developers management
router.get('/admin/developers', getDevelopers);
router.get('/admin/developers/:id', getDeveloperById);
router.put(
  '/admin/developers/:id/status',
  validateBody(updateDeveloperStatusSchema),
  updateDeveloperStatus
);

// Developer commissions
router.get('/admin/developers/commissions', adminFeaturesController.getDeveloperCommissions);

// Modules management
router.get('/admin/modules', getModules);
router.put('/admin/modules/:id/status', validateBody(updateModuleStatusSchema), updateModuleStatus);

// Developer Payouts Management
router.get('/admin/payouts', getAllPayouts);
router.post('/admin/payouts/:id/approve', approvePayout);
router.post('/admin/payouts/:id/reject', rejectPayout);

// Payments & Escrows
router.get('/admin/payments', getPayments);
router.get('/admin/escrows', getEscrows);

// Subscriptions
router.get('/admin/subscriptions', getSubscriptions);

// Support Tickets
router.get('/admin/support/tickets', getSupportTickets);

// Disputes
router.get('/admin/disputes', getDisputes);

// Data Reports
router.get('/admin/reports', getDataReports);
router.get('/admin/reports/fraud', getFraudReports);

// Notifications
router.get('/admin/notifications', getNotifications);

// Security & System Logs
router.get('/admin/security/logs', getSecurityLogs);
router.get('/admin/logs', getSystemLogs);

// API Keys
router.get('/admin/api-keys', getApiKeys);

// Admin Audit Logs
router.get('/admin/audit-logs', getAdminAuditLog);

// ============================================
// ESCROW ADMIN (with plural fix: /admin/escrow for frontend compat)
// ============================================

router.get('/admin/escrow', getAdminEscrows);
router.get('/admin/escrow/stats', getAdminEscrowStats);
router.post('/admin/escrow/:id/release', releaseAdminEscrow);
router.post('/admin/escrow/:id/refund', refundAdminEscrow);
router.post(
  '/admin/escrow/:id/arbitrate',
  validateBody(arbitrateEscrowSchema),
  arbitrateAdminEscrow
);

// ============================================
// PAYMENTS ADMIN STATS & ACTIONS
// ============================================

router.get('/admin/payments/stats', getAdminPaymentStats);
router.post('/admin/payments/:id/validate', validatePayment);
router.post('/admin/payments/:id/refund', refundPayment);

// ============================================
// SUBSCRIPTIONS ADMIN STATS & ACTIONS
// ============================================

router.get('/admin/subscriptions/stats', getAdminSubscriptionStats);
router.post('/admin/subscriptions/:id/cancel', cancelAdminSubscription);
router.post('/admin/subscriptions/:id/renew', renewAdminSubscription);

// ============================================
// SECURITY ADMIN
// ============================================

router.get('/admin/security/stats', getAdminSecurityStats);
router.get('/admin/security/admins', getAdminSecurityAdmins);
router.get('/admin/security/sessions', getAdminSecuritySessions);
router.delete('/admin/security/sessions/:id', revokeAdminSession);
router.get('/admin/security/attempts', getAdminSecurityAttempts);
router.get('/admin/security/blacklist', getAdminSecurityBlacklist);
router.post('/admin/security/blacklist', validateBody(blockIpSchema), blockAdminSecurityIp);
router.delete('/admin/security/blacklist/:ip(.*)', unblockAdminSecurityIp);
router.get('/admin/security/journal', getAdminSecurityJournal);

// ============================================
// DISPUTES ADMIN STATS & ACTIONS
// ============================================

router.get('/admin/disputes/stats', getDisputesStats);
router.put('/admin/disputes/:id/:action', updateDisputeStatus);

// ============================================
// MARKETPLACE ADMIN
// ============================================

router.get('/admin/marketplace/:type', getAdminMarketplaceItems);
router.put('/admin/marketplace/:type/:id/:action', updateAdminMarketplaceItem);

// ============================================
// ADS ADMIN
// ============================================

router.get('/admin/ads/campaigns', getAdminAdCampaigns);
router.get('/admin/ads/stats', getAdminAdStats);
router.get('/admin/ads/revenue', getAdminAdRevenue);
router.post('/admin/ads/campaigns/:id/validate', validateAdminAdCampaign);
router.post('/admin/ads/campaigns/:id/reject', validateBody(rejectAdSchema), rejectAdminAdCampaign);
router.post(
  '/admin/ads/campaigns/:id/suspend',
  validateBody(suspendAdSchema),
  suspendAdminAdCampaign
);

// ============================================
// AFRI SCORE ADMIN
// ============================================

router.get('/admin/afriscore/stats', getAdminAfriScoreStats);
router.get('/admin/afriscore/badges', getAdminAfriScoreBadges);
router.get('/admin/afriscore/history', getAdminAfriScoreHistory);
router.get('/admin/afriscore/audit', getAdminAfriScoreAudit);

// ============================================
// PARTNERS / DATA HUB ADMIN
// ============================================

router.get('/admin/partners', getAdminPartners);
router.post('/admin/partners/:id/approve', approveAdminPartner);
router.post('/admin/partners/:id/suspend', suspendAdminPartner);
router.post('/admin/partners/:id/revoke', revokeAdminPartner);
router.get('/admin/data-access-logs', getAdminDataAccessLogs);
router.post(
  '/admin/data/purge',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const { type, before } = req.body;
    if (!type || !before) {
      res.status(400).json({ success: false, error: 'type et before requis' });
      return;
    }
    const beforeDate = new Date(before as string);
    if (isNaN(beforeDate.getTime())) {
      res.status(400).json({ success: false, error: 'Date invalide' });
      return;
    }

    let deleted = 0;
    switch (type) {
      case 'notifications': {
        const result = await prisma.notification.deleteMany({
          where: { createdAt: { lt: beforeDate } },
        });
        deleted = result.count;
        break;
      }
      case 'logs': {
        const [sessions, tokens, events] = await Promise.all([
          prisma.session.deleteMany({ where: { createdAt: { lt: beforeDate } } }),
          prisma.refreshToken.deleteMany({ where: { createdAt: { lt: beforeDate } } }),
          prisma.securityLog
            .deleteMany({ where: { createdAt: { lt: beforeDate } } })
            .then((r) => r.count)
            .catch(() => 0),
        ]);
        deleted = sessions.count + tokens.count + events;
        break;
      }
      case 'analytics': {
        deleted = 0;
        break;
      }
      case 'backups': {
        deleted = 0;
        break;
      }
      default: {
        res.status(400).json({ success: false, error: 'Type de données non supporté' });
        return;
      }
    }

    res.json(successResponse({ deleted, type, before }, `${deleted} enregistrement(s) purgé(s)`));
  })
);
router.get('/admin/analytics', getAdminPlatformAnalytics);

// ============================================
// NEW ADMIN FEATURES
// ============================================

// Feature Flags
router.get('/admin/feature-flags', adminFeaturesController.getFeatureFlags);
router.get('/admin/feature-flags/:id', adminFeaturesController.getFeatureFlag);
router.post('/admin/feature-flags', adminFeaturesController.createFeatureFlag);
router.put('/admin/feature-flags/:id', adminFeaturesController.updateFeatureFlag);
router.delete('/admin/feature-flags/:id', adminFeaturesController.deleteFeatureFlag);
router.patch('/admin/feature-flags/:id/toggle', adminFeaturesController.toggleFeatureFlag);

// Admin Roles & Permissions
router.get('/admin/roles', adminFeaturesController.getAdminRoles);
router.post('/admin/roles', adminFeaturesController.createAdminRole);
router.put('/admin/roles/:id', adminFeaturesController.updateAdminRole);
router.delete('/admin/roles/:id', adminFeaturesController.deleteAdminRole);
router.get('/admin/permissions', adminFeaturesController.getAdminPermissions);
router.post('/admin/roles/assign', adminFeaturesController.assignRoleToUser);
router.post('/admin/roles/unassign', adminFeaturesController.removeRoleFromUser);
router.get('/admin/users/roles/:userId', adminFeaturesController.getUserRoles);
router.get('/admin/users/admins', adminFeaturesController.getAdminUsers);

// Automation Rules
router.get('/admin/automation/rules', adminFeaturesController.getAutomationRules);
router.get('/admin/automation/rules/:id', adminFeaturesController.getAutomationRule);
router.post('/admin/automation/rules', adminFeaturesController.createAutomationRule);
router.put('/admin/automation/rules/:id', adminFeaturesController.updateAutomationRule);
router.delete('/admin/automation/rules/:id', adminFeaturesController.deleteAutomationRule);
router.patch('/admin/automation/rules/:id/toggle', adminFeaturesController.toggleAutomationRule);
router.get('/admin/automation/logs/:ruleId', adminFeaturesController.getAutomationExecutionLogs);
router.get('/admin/automation/triggers', adminFeaturesController.getAutomationTriggers);
router.get('/admin/automation/action-types', adminFeaturesController.getAutomationActionTypes);

// CMS Pages
router.get('/admin/cms/pages', adminFeaturesController.getCmsPages);
router.get('/admin/cms/pages/:slug', adminFeaturesController.getCmsPage);
router.post('/admin/cms/pages', adminFeaturesController.createCmsPage);
router.put('/admin/cms/pages/:id', adminFeaturesController.updateCmsPage);
router.delete('/admin/cms/pages/:id', adminFeaturesController.deleteCmsPage);
router.post('/admin/cms/pages/:id/publish', adminFeaturesController.publishCmsPage);
router.get('/admin/cms/categories', adminFeaturesController.getCmsCategories);
router.post('/admin/cms/categories', adminFeaturesController.createCmsCategory);
router.put('/admin/cms/categories/:id', adminFeaturesController.updateCmsCategory);
router.delete('/admin/cms/categories/:id', adminFeaturesController.deleteCmsCategory);

// Form Templates
router.get('/admin/forms/templates', adminFeaturesController.getFormTemplates);
router.get('/admin/forms/templates/:slug', adminFeaturesController.getFormTemplate);
router.post('/admin/forms/templates', adminFeaturesController.createFormTemplate);
router.put('/admin/forms/templates/:id', adminFeaturesController.updateFormTemplate);
router.delete('/admin/forms/templates/:id', adminFeaturesController.deleteFormTemplate);
router.post('/admin/forms/templates/:id/activate', adminFeaturesController.activateFormTemplate);
router.get('/admin/forms/submissions/:templateId', adminFeaturesController.getFormSubmissions);
router.get('/admin/forms/submissions/detail/:id', adminFeaturesController.getFormSubmission);

// Notification Templates
router.get('/admin/notification-templates', adminFeaturesController.getNotificationTemplates);
router.get('/admin/notification-templates/:id', adminFeaturesController.getNotificationTemplate);
router.post('/admin/notification-templates', adminFeaturesController.createNotificationTemplate);
router.put('/admin/notification-templates/:id', adminFeaturesController.updateNotificationTemplate);
router.delete(
  '/admin/notification-templates/:id',
  adminFeaturesController.deleteNotificationTemplate
);
router.get('/admin/notification-types', adminFeaturesController.getNotificationTypes);
router.get('/admin/notification-channels', adminFeaturesController.getNotificationChannels);

// Copilot Configuration
router.get('/admin/copilot/config', adminFeaturesController.getPlatformCopilotConfig);
router.put('/admin/copilot/config', adminFeaturesController.updatePlatformCopilotConfig);
router.get('/admin/copilot/business/:businessId', adminFeaturesController.getBusinessCopilotConfig);
router.put(
  '/admin/copilot/business/:businessId',
  adminFeaturesController.updateBusinessCopilotConfig
);
router.get('/admin/copilot/platform-health', adminFeaturesController.getPlatformHealthCtrl);

// Media Moderation
router.get('/admin/moderation/items', adminFeaturesController.getMediaModerationItems);
router.get('/admin/moderation/items/:id', adminFeaturesController.getMediaModerationItem);
// Fusionné avec contentReportService — utilise /api/reports/ à la place
// router.post('/admin/moderation/report', adminFeaturesController.reportMedia);
// Redirigé vers contentReportService pour unification
router.post('/admin/moderation/report', adminFeaturesController.reportMediaViaContentReport);
router.post('/admin/moderation/approve/:id', adminFeaturesController.approveMedia);
router.post('/admin/moderation/reject/:id', adminFeaturesController.rejectMedia);
router.post('/admin/moderation/flag/:id', adminFeaturesController.flagMedia);
router.get('/admin/moderation/stats', adminFeaturesController.getModerationStats);

// Commission Configuration
router.get('/admin/commissions', adminFeaturesController.getCommissionConfigs);
router.get('/admin/commissions/:key', adminFeaturesController.getCommissionConfig);
router.post('/admin/commissions', adminFeaturesController.createCommissionConfig);
router.put('/admin/commissions/:id', adminFeaturesController.updateCommissionConfig);
router.delete('/admin/commissions/:id', adminFeaturesController.deleteCommissionConfig);

// User Warnings
router.get('/admin/users/:userId/warnings', adminFeaturesController.getUserWarnings);
router.post('/admin/users/:userId/warnings', adminFeaturesController.issueWarning);
router.delete('/admin/warnings/:id', adminFeaturesController.revokeWarning);
router.get('/admin/warnings', adminFeaturesController.getAllWarnings);

// Subscription Plans
router.get('/admin/subscription-plans', adminFeaturesController.getAllSubscriptionPlans);
router.get('/admin/subscription-plans/:id', adminFeaturesController.getSubscriptionPlan);
router.post('/admin/subscription-plans', adminFeaturesController.createSubscriptionPlan);
router.put('/admin/subscription-plans/:id', adminFeaturesController.updateSubscriptionPlan);
router.delete('/admin/subscription-plans/:id', adminFeaturesController.deleteSubscriptionPlan);
router.post('/admin/subscription-plans/:id/privileges', adminFeaturesController.addPlanPrivilege);
router.put('/admin/subscription-plans/privileges/:id', adminFeaturesController.updatePlanPrivilege);
router.delete(
  '/admin/subscription-plans/privileges/:id',
  adminFeaturesController.removePlanPrivilege
);

// AfriScore
router.post('/admin/afriscore/recompute', adminFeaturesController.recomputeAllAfriScores);
router.get('/admin/afriscore/rules', adminFeaturesController.getAfriScoreRules);
router.put('/admin/afriscore/rules', adminFeaturesController.updateAfriScoreRules);

// Backup endpoints (real implementations)
router.get('/admin/backups', adminFeaturesController.getBackups);
router.post('/admin/backups', adminFeaturesController.createBackup);
router.post('/admin/backups/:id/restore', adminFeaturesController.restoreBackup);
router.get('/admin/backups/:id/download', adminFeaturesController.getBackupDownloadUrl);
router.put('/admin/backups/auto', adminFeaturesController.toggleAutoBackup);

// Settings endpoints (real implementations)
router.get('/admin/settings', adminFeaturesController.getPlatformSettings);
router.put('/admin/settings', adminFeaturesController.updatePlatformSettings);

// Verification settings (KYC mode)
router.get('/admin/settings/verification', adminFeaturesController.getVerificationSettings);
router.put('/admin/settings/verification', adminFeaturesController.updateVerificationSettings);

// Settings by category
router.get(
  '/admin/settings/category/:category',
  adminFeaturesController.getPlatformSettingsByCategory
);

// Media Management (Admin)
router.get('/admin/stories', adminFeaturesController.getAdminStories);
router.put('/admin/stories/:id/status', adminFeaturesController.updateAdminStoryStatus);
router.delete('/admin/stories/:id', adminFeaturesController.deleteAdminStory);
router.get('/admin/shorts', adminFeaturesController.getAdminShorts);
router.put('/admin/shorts/:id/status', adminFeaturesController.updateAdminShortStatus);
router.delete('/admin/shorts/:id', adminFeaturesController.deleteAdminShort);
router.get('/admin/lives', adminFeaturesController.getAdminLives);
router.put('/admin/lives/:id/status', adminFeaturesController.updateAdminLiveStatus);

// Platform Revenue Stats
router.get('/admin/revenue/stats', adminFeaturesController.getPlatformRevenue);
router.get('/admin/revenue/stats/:period', adminFeaturesController.getPlatformRevenue);

// ============================================
// MONETIZATION AUDIT
// ============================================

router.get('/admin/monetization/audit', adminFeaturesController.getMonetizationAudit);

// ============================================
// PROMO CODES ADMIN
// ============================================

router.get('/admin/promos/coupons', adminFeaturesController.getAdminCoupons);
router.get('/admin/promos/promotions', adminFeaturesController.getAdminPromotions);
router.get('/admin/promos/stats', adminFeaturesController.getAdminCouponStats);
router.patch('/admin/promos/coupons/:id/disable', adminFeaturesController.disableAdminCoupon);

// ============================================
// CAMPAIGNS (Phase 5 — Marketing Automation)
// ============================================

router.get('/admin/campaigns', adminFeaturesController.getCampaigns);
router.get('/admin/campaigns/:id', adminFeaturesController.getCampaign);
router.post('/admin/campaigns', adminFeaturesController.createCampaign);
router.put('/admin/campaigns/:id', adminFeaturesController.updateCampaign);
router.delete('/admin/campaigns/:id', adminFeaturesController.deleteCampaign);
router.post('/admin/campaigns/:id/start', adminFeaturesController.startCampaign);
router.get('/admin/campaigns/templates/all', adminFeaturesController.getCampaignTemplates);
router.get('/admin/campaigns/logs/:campaignId', adminFeaturesController.getCampaignExecutionLogs);

// ============================================
// MODULE DEMAND & MATCHING (Phase 6)
// ============================================

router.get('/admin/demands', moduleDemandController.getAllDemands);
router.get('/admin/demands/:id', moduleDemandController.getDemand);
router.post('/admin/demands', moduleDemandController.createDemand);
router.put('/admin/demands/:id/status', moduleDemandController.updateDemandStatus);
router.delete('/admin/demands/:id', moduleDemandController.deleteDemand);
router.get('/admin/demands/:id/matches', moduleDemandController.findMatches);
router.post('/admin/demands/:id/auto-match', moduleDemandController.autoMatch);
router.put('/admin/matches/:matchId/status', moduleDemandController.updateMatch);

// ============================================
// REVIEWS MODERATION (unified from multiple review models)
// ============================================

router.get(
  '/admin/reviews',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const { type = 'business', page = '1', limit = '20' } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    let reviews: any[] = [];
    let total = 0;

    if (type === 'business' || type === 'all') {
      const rows = await prisma.businessReview.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          business: { select: { id: true, name: true } },
        },
      });
      reviews = rows.map((r) => ({
        id: r.id,
        author: {
          id: r.user.id,
          name: `${r.user.firstName} ${r.user.lastName}`,
          email: r.user.email,
        },
        target: r.business,
        rating: r.rating,
        content: r.comment,
        status: r.isActive ? 'APPROVED' : 'HIDDEN',
        createdAt: r.createdAt,
      }));
      total = await prisma.businessReview.count();
    } else if (type === 'modules' || type === 'developers') {
      const rows = await prisma.developerModuleReview.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          module: { select: { id: true, name: true } },
        },
      });
      reviews = rows.map((r) => ({
        id: r.id,
        author: {
          id: r.user.id,
          name: `${r.user.firstName} ${r.user.lastName}`,
          email: r.user.email,
        },
        target: r.module,
        rating: r.rating,
        content: r.comment,
        status: r.isActive ? 'APPROVED' : 'HIDDEN',
        createdAt: r.createdAt,
      }));
      total = await prisma.developerModuleReview.count();
    } else if (type === 'signales') {
      const rows = await prisma.contentReport.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
      reviews = rows.map((r) => ({
        id: r.id,
        author: {
          id: r.reporter.id,
          name: `${r.reporter.firstName} ${r.reporter.lastName}`,
          email: r.reporter.email,
        },
        target: { name: 'Signalement' },
        rating: 0,
        content: r.description || r.reason,
        status: 'PENDING',
        createdAt: r.createdAt,
      }));
      total = await prisma.contentReport.count();
    }

    res.json(successResponse({ reviews, totalPages: Math.ceil(total / take) || 1 }));
  })
);

router.put(
  '/admin/reviews/:id/:action',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const { id, action } = req.params;
    const review = await prisma.businessReview
      .findUnique({ where: { id }, select: { businessId: true } })
      .catch(() => null);
    if (action === 'approve') {
      await prisma.businessReview
        .update({ where: { id }, data: { isActive: true } })
        .catch(() => {});
      await prisma.developerModuleReview
        .update({ where: { id }, data: { isActive: true } })
        .catch(() => {});
    } else if (action === 'hide') {
      await prisma.businessReview
        .update({ where: { id }, data: { isActive: false } })
        .catch(() => {});
      await prisma.developerModuleReview
        .update({ where: { id }, data: { isActive: false } })
        .catch(() => {});
    }
    if (review?.businessId) await recalculateBusinessRating(review.businessId);
    res.json(successResponse(null, 'Avis mis à jour'));
  })
);

router.delete(
  '/admin/reviews/:id',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const review = await prisma.businessReview
      .findUnique({ where: { id: req.params.id }, select: { businessId: true } })
      .catch(() => null);
    await prisma.businessReview.delete({ where: { id: req.params.id } }).catch(() => {});
    await prisma.developerModuleReview.delete({ where: { id: req.params.id } }).catch(() => {});
    if (review?.businessId) await recalculateBusinessRating(review.businessId);
    res.json(successResponse(null, 'Avis supprimé'));
  })
);

// ============================================
// SUPPORT STATS & TICKET ACTIONS
// ============================================

router.get(
  '/admin/support/stats',
  catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response) => {
    const [total, open, inProgress, resolved] = await Promise.all([
      prisma.developerSupportTicket.count(),
      prisma.developerSupportTicket.count({ where: { status: 'OPEN' } }),
      prisma.developerSupportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.developerSupportTicket.count({ where: { status: 'RESOLVED' } }),
    ]);
    res.json(successResponse({ total, open, inProgress, resolved, avgTime: '-' }));
  })
);

router.put(
  '/admin/support/tickets/:id/:action',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const { id, action } = req.params;
    const statusMap: Record<string, string> = {
      assign: 'IN_PROGRESS',
      resolve: 'RESOLVED',
      close: 'CLOSED',
      reopen: 'OPEN',
    };
    const status = statusMap[action];
    if (!status) {
      res.status(400).json({ success: false, error: 'Action invalide' });
      return;
    }
    await prisma.developerSupportTicket.update({ where: { id }, data: { status } });
    res.json(successResponse(null, 'Ticket mis à jour'));
  })
);

// ============================================
// USER DETAIL SUB-ENDPOINTS
// ============================================

router.get(
  '/admin/users/:id/sessions',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const sessions = await prisma.session.findMany({
      where: { userId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(successResponse({ sessions }));
  })
);

router.get(
  '/admin/users/:id/payments',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const payments = await prisma.payment.findMany({
      where: { userId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(successResponse({ payments }));
  })
);

router.get(
  '/admin/users/:id/reports',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const reports = await prisma.contentReport.findMany({
      where: { reporterId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(successResponse({ reports }));
  })
);

// ============================================
// MODULE DETAIL & COMMISSIONS
// ============================================

router.get(
  '/admin/modules/:id',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const mod = await prisma.developerModule.findUnique({
      where: { id: req.params.id },
      include: {
        developer: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        _count: { select: { reviews: true } },
      },
    });
    if (!mod) {
      res.status(404).json({ success: false, error: 'Module introuvable' });
      return;
    }
    const data = {
      ...mod,
      developer: mod.developer
        ? {
            id: mod.developer.id,
            name: `${mod.developer.user.firstName} ${mod.developer.user.lastName}`,
            email: mod.developer.user.email,
          }
        : null,
    };
    res.json(successResponse(data));
  })
);

router.get(
  '/admin/modules/:id/commissions',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const mod = await prisma.developerModule.findUnique({
      where: { id: req.params.id },
      select: { price: true },
    });
    if (!mod) {
      res.status(404).json({ success: false, error: 'Module introuvable' });
      return;
    }
    const commission = await prisma.moduleCommission.findFirst({
      where: { moduleId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    const rate = commission?.commissionRate || 0.1;
    const price = mod.price ? Number(mod.price) : 0;
    res.json(
      successResponse({
        rate,
        amount: price * rate,
        netAmount: price * (1 - rate),
        transactions: [],
      })
    );
  })
);

router.put(
  '/admin/modules/:id',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const updateData: Record<string, any> = {};
    if (req.body.pricingType !== undefined) updateData.pricingType = req.body.pricingType;
    if (req.body.price !== undefined) updateData.price = String(req.body.price);
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.isPublished !== undefined) updateData.isPublished = req.body.isPublished;
    if (req.body.isFeatured !== undefined) updateData.isFeatured = req.body.isFeatured;
    // Commission rate is managed globally via CommissionConfig, not per-module

    const moduleData = await prisma.developerModule.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(successResponse(moduleData, 'Module mis à jour'));
  })
);

// ============================================
// WARNINGS STATS
// ============================================

router.get(
  '/admin/warnings/stats',
  catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response) => {
    const total = await prisma.userWarning.count();
    res.json(successResponse({ total, active: total, expired: 0 }));
  })
);

// ============================================
// STATISTICS
// ============================================

router.get(
  '/admin/statistics',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, newToday, newWeek, newMonth, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
    ]);

    const totalBusinesses = await prisma.business.count();
    const developerIds = await prisma.developerModule.groupBy({
      by: ['developerId'],
      _count: true,
    });
    const totalModules = await prisma.developerModule.count();
    const publishedModules = await prisma.developerModule.count({ where: { status: 'PUBLISHED' } });
    const pendingModules = await prisma.developerModule.count({
      where: { status: 'PENDING_REVIEW' },
    });

    res.json(
      successResponse({
        users: { total: totalUsers, newToday, newWeek, newMonth, active: activeUsers, byRole: [] },
        business: { total: totalBusinesses, new: 0, byType: [], byCountry: [] },
        developers: { total: developerIds.length, new: 0, verified: 0, pending: 0 },
        modules: { total: totalModules, published: publishedModules, pending: pendingModules },
        revenue: { total: 0, monthly: 0, growth: 0 },
        transactions: { total: 0, volume: 0 },
        platform: { uptime: '99.9%', performance: 'OK' },
      })
    );
  })
);

// ============================================
// FINANCIAL REPORTS
// ============================================

router.get(
  '/admin/reports/:type',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const { type } = req.params;
    const [
      totalRevenue,
      totalTransactions,
      totalUsers,
      totalBusinesses,
      totalModulesData,
      totalCampaigns,
      totalPartners,
    ] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true } }).then((r) => r._sum.amount || 0),
      prisma.payment.count(),
      prisma.user.count(),
      prisma.business.count(),
      prisma.developerModule.count(),
      prisma.adCampaign.count(),
      prisma.dataPartner.count(),
    ]);
    const developerCount = await prisma.developerModule
      .groupBy({ by: ['developerId'], _count: true })
      .then((r) => r.length);

    const reports: Record<string, any> = {
      financial: {
        totalRevenue: Number(totalRevenue),
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? Number(totalRevenue) / totalTransactions : 0,
        revenueByMonth: [],
      },
      activity: { totalUsers, activeToday: 0, newRegistrations: 0, sessions: 0 },
      growth: { userGrowth: 0, businessGrowth: 0, revenueGrowth: 0, moduleGrowth: 0 },
      users: { total: totalUsers, active: 0, premium: 0, suspended: 0 },
      business: { total: totalBusinesses, verified: 0, active: 0 },
      developers: { total: developerCount, verified: 0, modules: totalModulesData },
      advertising: { totalCampaigns, active: 0, revenue: 0 },
      marketplace: { totalModules: totalModulesData, totalSales: 0, revenue: 0 },
      datahub: { totalPartners, totalRequests: 0, totalShared: 0 },
    };

    res.json(successResponse(reports[type] || { message: 'Rapport non disponible' }));
  })
);

// ============================================
// FRAUD REPORT ACTIONS
// ============================================

router.post(
  '/admin/reports/fraud/:id/approve',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    await prisma.contentReport.update({
      where: { id: req.params.id },
      data: { status: 'ACTION_TAKEN', reviewedById: req.user!.id, resolvedAt: new Date() },
    });
    res.json(successResponse(null, 'Signalement approuvé'));
  })
);

router.post(
  '/admin/reports/fraud/:id/reject',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    await prisma.contentReport.update({
      where: { id: req.params.id },
      data: { status: 'DISMISSED', reviewedById: req.user!.id, resolvedAt: new Date() },
    });
    res.json(successResponse(null, 'Signalement rejeté'));
  })
);

router.post(
  '/admin/reports/fraud/:id/ban',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const report = await prisma.contentReport.findUnique({
      where: { id: req.params.id },
      include: { reporter: true },
    });
    if (report?.reporterId) {
      await prisma.user.update({ where: { id: report.reporterId }, data: { isActive: false } });
    }
    await prisma.contentReport.update({
      where: { id: req.params.id },
      data: { status: 'ACTION_TAKEN', reviewedById: req.user!.id, resolvedAt: new Date() },
    });
    res.json(successResponse(null, 'Utilisateur banni'));
  })
);

// ============================================
// API KEYS MUTATIONS
// ============================================

router.post(
  '/admin/api-keys',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const dev = await prisma.developerProfile.findFirst({ where: { userId: req.user!.id } });
    if (!dev) {
      res.status(400).json({ success: false, error: 'Aucun profil développeur associé' });
      return;
    }
    const key = await prisma.developerApiKey.create({
      data: {
        developerId: dev.id,
        name: req.body.partnerName || req.body.name || 'API Key',
        key: `afb_${Buffer.from(Math.random().toString(36).substring(2)).toString('base64').substring(0, 32)}`,
        scopes: [req.body.type || 'READ'],
        isActive: true,
      },
    });
    res.json(successResponse(key, 'Clé API créée'));
  })
);

router.post(
  '/admin/api-keys/:id/regenerate',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const key = await prisma.developerApiKey.update({
      where: { id: req.params.id },
      data: {
        key: `afb_${Buffer.from(Math.random().toString(36).substring(2)).toString('base64').substring(0, 32)}`,
      },
    });
    res.json(successResponse(key, 'Clé régénérée'));
  })
);

router.post(
  '/admin/api-keys/:id/suspend',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    await prisma.developerApiKey.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json(successResponse(null, 'Clé suspendue'));
  })
);

router.post(
  '/admin/api-keys/:id/activate',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    await prisma.developerApiKey.update({ where: { id: req.params.id }, data: { isActive: true } });
    res.json(successResponse(null, 'Clé activée'));
  })
);

router.delete(
  '/admin/api-keys/:id',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    await prisma.developerApiKey.delete({ where: { id: req.params.id } });
    res.json(successResponse(null, 'Clé supprimée'));
  })
);

// ============================================
// AFRIBIZ TV (model-free, returns mock-compatible data)
// ============================================

router.get(
  '/admin/media/tv',
  catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response) => {
    const videos = await prisma.post.findMany({
      where: { status: 'PUBLISHED', coverImage: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });
    res.json(
      successResponse(
        videos.map((v) => ({
          id: v.id,
          title: v.title || 'Vidéo',
          description: v.excerpt || v.content,
          videoUrl: v.coverImage || '',
          thumbnail: '',
          category: 'Général',
          status:
            v.status === 'PUBLISHED' ? 'PUBLIÉ' : v.status === 'ARCHIVED' ? 'ARCHIVÉ' : 'BROUILLON',
          views: v.viewsCount,
          featured: v.isPinned,
          createdAt: v.createdAt,
        }))
      )
    );
  })
);

router.post(
  '/admin/media/tv',
  catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response) => {
    const mockVideo = {
      id: `mock-${Date.now()}`,
      title: _req.body.title || 'Nouvelle vidéo',
      description: _req.body.description || '',
      videoUrl: _req.body.videoUrl || '',
      thumbnail: '',
      category: 'Général',
      status: _req.body.status === 'PUBLIÉ' ? 'PUBLIÉ' : 'BROUILLON',
      views: 0,
      featured: false,
      createdAt: new Date(),
    };
    res.json(successResponse(mockVideo, 'Vidéo créée (mode démo)'));
  })
);

router.put(
  '/admin/media/tv/:id',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    res.json(successResponse({ id: req.params.id, ...req.body }, 'Vidéo mise à jour (mode démo)'));
  })
);

router.delete(
  '/admin/media/tv/:id',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    res.json(successResponse(null, 'Vidéo supprimée (mode démo)'));
  })
);

export default router;
