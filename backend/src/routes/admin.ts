import express, { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { adminLimiter } from '../middlewares/rateLimiter';
import {
  updateUserStatusSchema,
  updateBusinessStatusSchema,
  updateBusinessVerificationSchema,
  updateDeveloperStatusSchema,
  updateModuleStatusSchema,
  createBackupSchema,
  restoreBackupSchema,
  arbitrateEscrowSchema,
  blockIpSchema,
  rejectAdCampaignSchema as rejectAdSchema,
  suspendAdCampaignSchema as suspendAdSchema,
  updatePlatformSettingsSchema,
  updateAfriScoreRulesSchema,
} from '../validators/admin';
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  getUserActivity,
  getBusinesses,
  getBusinessById,
  updateBusinessStatus,
  updateBusinessVerification,
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
  getBackups,
  createBackup,
  restoreBackup,
  getApiKeys,
  getFraudReports,
  getPlatformSettings,
  updatePlatformSettings,
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
  getAdminAfriScoreRules,
  updateAdminAfriScoreRules,
  getAdminAfriScoreBadges,
  getAdminAfriScoreHistory,
  getAdminAfriScoreAudit,
  recomputeAllAfriScores,
  getAdminPartners,
  approveAdminPartner,
  suspendAdminPartner,
  revokeAdminPartner,
  getAdminDataAccessLogs,
  getAdminPlatformAnalytics,
} from '../controllers/adminController';
import * as adminFeaturesController from '../controllers/adminFeaturesController';

const router: Router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authMiddleware, requireRole(['ADMIN']), adminLimiter);

// Dashboard
router.get('/admin/dashboard/stats', getDashboardStats);

// Users management
router.get('/admin/users', getUsers);
router.get('/admin/users/:id', getUserById);
router.put('/admin/users/:id/status', validateBody(updateUserStatusSchema), updateUserStatus);
router.get('/admin/users/:id/activity', getUserActivity);

// Businesses management
router.get('/admin/businesses', getBusinesses);
router.get('/admin/businesses/:id', getBusinessById);
router.put('/admin/businesses/:id/status', validateBody(updateBusinessStatusSchema), updateBusinessStatus);
router.put('/admin/businesses/:id/verification', validateBody(updateBusinessVerificationSchema), updateBusinessVerification);

// Developers management
router.get('/admin/developers', getDevelopers);
router.get('/admin/developers/:id', getDeveloperById);
router.put('/admin/developers/:id/status', validateBody(updateDeveloperStatusSchema), updateDeveloperStatus);

// Developer commissions
router.get('/admin/developers/commissions', adminFeaturesController.getDeveloperCommissions);

// Modules management
router.get('/admin/modules', getModules);
router.put('/admin/modules/:id/status', validateBody(updateModuleStatusSchema), updateModuleStatus);

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
router.post('/admin/escrow/:id/arbitrate', validateBody(arbitrateEscrowSchema), arbitrateAdminEscrow);

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
router.post('/admin/ads/campaigns/:id/suspend', validateBody(suspendAdSchema), suspendAdminAdCampaign);

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
router.delete('/admin/notification-templates/:id', adminFeaturesController.deleteNotificationTemplate);
router.get('/admin/notification-types', adminFeaturesController.getNotificationTypes);
router.get('/admin/notification-channels', adminFeaturesController.getNotificationChannels);

// Copilot Configuration
router.get('/admin/copilot/config', adminFeaturesController.getPlatformCopilotConfig);
router.put('/admin/copilot/config', adminFeaturesController.updatePlatformCopilotConfig);
router.get('/admin/copilot/business/:businessId', adminFeaturesController.getBusinessCopilotConfig);
router.put('/admin/copilot/business/:businessId', adminFeaturesController.updateBusinessCopilotConfig);

// Media Moderation
router.get('/admin/moderation/items', adminFeaturesController.getMediaModerationItems);
router.get('/admin/moderation/items/:id', adminFeaturesController.getMediaModerationItem);
router.post('/admin/moderation/report', adminFeaturesController.reportMedia);
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
router.delete('/admin/subscription-plans/privileges/:id', adminFeaturesController.removePlanPrivilege);

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
router.get('/admin/settings/category/:category', adminFeaturesController.getPlatformSettingsByCategory);

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

export default router;
