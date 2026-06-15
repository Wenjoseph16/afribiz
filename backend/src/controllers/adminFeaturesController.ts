import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as adminFeaturesService from '../services/adminFeaturesService';
import * as platformSettingsService from '../services/platformSettingsService';
import { getPlatformRevenueStats } from '../services/platformRevenueStats';
import { prisma } from '../lib/db';
import { logMonetizationChanges, getMonetizationAuditLogs } from '../services/monetizationAudit';

// ============================================
// PLATFORM SETTINGS
// ============================================

export const getPlatformSettings = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const settings = await adminFeaturesService.getPlatformSettings();
  res.json({ success: true, data: settings });
});

export const updatePlatformSettings = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const oldSettings = await adminFeaturesService.getPlatformSettings();
  const settings = await adminFeaturesService.updatePlatformSettings(req.body);

  // Audit log for monetization changes
  const monetizationKeys = ['transactionCommissionRate', 'escrowCommissionRate', 'developerModuleCommissionRate', 'minimumEscrowFee', 'maximumEscrowFee', 'currency'];
  const changes: { key: string; oldValue?: any; newValue?: any }[] = [];
  for (const [key, value] of Object.entries(req.body)) {
    const cleanKey = key.replace('monetization_', '');
    if (monetizationKeys.includes(cleanKey)) {
      changes.push({ key: cleanKey, oldValue: oldSettings[key], newValue: value });
    }
  }
  if (changes.length > 0 && req.user) {
    await logMonetizationChanges(changes, req.user.id, 'admin_settings_page');
  }

  res.json({ success: true, data: settings, message: 'Paramètres mis à jour' });
});

export const getPlatformSettingsByCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const settings = await adminFeaturesService.getPlatformSettingsByCategory(req.params.category);
  res.json({ success: true, data: settings });
});

export const getVerificationSettings = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const settings = await platformSettingsService.getVerificationSettings();
  res.json({ success: true, data: settings });
});

export const updateVerificationSettings = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const settings = await platformSettingsService.updateVerificationSettings(req.body);
  res.json({ success: true, data: settings, message: 'Paramètres de vérification mis à jour' });
});

// ============================================
// FEATURE FLAGS
// ============================================

export const getFeatureFlags = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { scope, enabled } = req.query as any;
  const flags = await adminFeaturesService.getFeatureFlags({ scope, enabled });
  res.json({ success: true, data: flags });
});

export const getFeatureFlag = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const flag = await adminFeaturesService.getFeatureFlag(req.params.id);
  res.json({ success: true, data: flag });
});

export const createFeatureFlag = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const flag = await adminFeaturesService.createFeatureFlag(req.body);
  res.json({ success: true, data: flag, message: 'Feature flag créé' });
});

export const updateFeatureFlag = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const flag = await adminFeaturesService.updateFeatureFlag(req.params.id, req.body);
  res.json({ success: true, data: flag, message: 'Feature flag mis à jour' });
});

export const deleteFeatureFlag = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  await adminFeaturesService.deleteFeatureFlag(req.params.id);
  res.json({ success: true, data: null, message: 'Feature flag supprimé' });
});

export const toggleFeatureFlag = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const flag = await adminFeaturesService.toggleFeatureFlag(req.params.id);
  res.json({ success: true, data: flag, message: 'Feature flag basculé' });
});

// ============================================
// ADMIN ROLES & PERMISSIONS
// ============================================

export const getAdminRoles = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const roles = await adminFeaturesService.getAdminRoles();
  res.json({ success: true, data: roles });
});

export const createAdminRole = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const role = await adminFeaturesService.createAdminRole(req.body);
  res.json({ success: true, data: role, message: 'Rôle créé' });
});

export const updateAdminRole = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const role = await adminFeaturesService.updateAdminRole(req.params.id, req.body);
  res.json({ success: true, data: role, message: 'Rôle mis à jour' });
});

export const deleteAdminRole = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  await adminFeaturesService.deleteAdminRole(req.params.id);
  res.json({ success: true, data: null, message: 'Rôle supprimé' });
});

export const getAdminPermissions = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const permissions = await adminFeaturesService.getAdminPermissions();
  res.json({ success: true, data: permissions });
});

export const assignRoleToUser = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { userId, roleId } = req.body;
  const result = await adminFeaturesService.assignRoleToUser(userId, roleId);
  res.json({ success: true, data: result, message: 'Rôle assigné' });
});

export const removeRoleFromUser = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { userId, roleId } = req.body;
  await adminFeaturesService.removeRoleFromUser(userId, roleId);
  res.json({ success: true, data: null, message: 'Rôle retiré' });
});

export const getUserRoles = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const roles = await adminFeaturesService.getUserRoles(req.params.userId);
  res.json({ success: true, data: roles });
});

export const getAdminUsers = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const users = await adminFeaturesService.getAdminUsers();
  res.json({ success: true, data: users });
});

// ============================================
// AUTOMATION RULES
// ============================================

export const getAutomationRules = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { trigger, status } = req.query as any;
  const rules = await adminFeaturesService.getAutomationRules({ trigger, status });
  res.json({ success: true, data: rules });
});

export const getAutomationRule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const rule = await adminFeaturesService.getAutomationRule(req.params.id);
  res.json({ success: true, data: rule });
});

export const createAutomationRule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const rule = await adminFeaturesService.createAutomationRule(req.body);
  res.json({ success: true, data: rule, message: 'Règle d\'automatisation créée' });
});

export const updateAutomationRule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const rule = await adminFeaturesService.updateAutomationRule(req.params.id, req.body);
  res.json({ success: true, data: rule, message: 'Règle d\'automatisation mise à jour' });
});

export const deleteAutomationRule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  await adminFeaturesService.deleteAutomationRule(req.params.id);
  res.json({ success: true, data: null, message: 'Règle d\'automatisation supprimée' });
});

export const toggleAutomationRule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const rule = await adminFeaturesService.toggleAutomationRule(req.params.id);
  res.json({ success: true, data: rule, message: 'Statut de la règle basculé' });
});

export const getAutomationExecutionLogs = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const logs = await adminFeaturesService.getAutomationExecutionLogs(req.params.ruleId);
  res.json({ success: true, data: logs });
});

export const getAutomationTriggers = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const triggers = await adminFeaturesService.getAutomationTriggers();
  res.json({ success: true, data: triggers });
});

export const getAutomationActionTypes = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const types = await adminFeaturesService.getAutomationActionTypes();
  res.json({ success: true, data: types });
});

// ============================================
// CMS PAGES
// ============================================

export const getCmsPages = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { category, status, search } = req.query as any;
  const pages = await adminFeaturesService.getCmsPages({ category, status, search });
  res.json({ success: true, data: pages });
});

export const getCmsPage = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const page = await adminFeaturesService.getCmsPage(req.params.slug);
  res.json({ success: true, data: page });
});

export const createCmsPage = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const page = await adminFeaturesService.createCmsPage(req.body, req.user!.id);
  res.json({ success: true, data: page, message: 'Page CMS créée' });
});

export const updateCmsPage = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const page = await adminFeaturesService.updateCmsPage(req.params.id, req.body);
  res.json({ success: true, data: page, message: 'Page CMS mise à jour' });
});

export const deleteCmsPage = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  await adminFeaturesService.deleteCmsPage(req.params.id);
  res.json({ success: true, data: null, message: 'Page CMS supprimée' });
});

export const publishCmsPage = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const page = await adminFeaturesService.publishCmsPage(req.params.id);
  res.json({ success: true, data: page, message: 'Page CMS publiée' });
});

export const getCmsCategories = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const categories = await adminFeaturesService.getCmsCategories();
  res.json({ success: true, data: categories });
});

export const createCmsCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const cat = await adminFeaturesService.createCmsCategory(req.body);
  res.json({ success: true, data: cat, message: 'Catégorie CMS créée' });
});

export const updateCmsCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const cat = await adminFeaturesService.updateCmsCategory(req.params.id, req.body);
  res.json({ success: true, data: cat, message: 'Catégorie CMS mise à jour' });
});

export const deleteCmsCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  await adminFeaturesService.deleteCmsCategory(req.params.id);
  res.json({ success: true, data: null, message: 'Catégorie CMS supprimée' });
});

// ============================================
// FORM TEMPLATES
// ============================================

export const getFormTemplates = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { category, status } = req.query as any;
  const templates = await adminFeaturesService.getFormTemplates({ category, status });
  res.json({ success: true, data: templates });
});

export const getFormTemplate = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const template = await adminFeaturesService.getFormTemplate(req.params.slug);
  res.json({ success: true, data: template });
});

export const createFormTemplate = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const template = await adminFeaturesService.createFormTemplate(req.body);
  res.json({ success: true, data: template, message: 'Template de formulaire créé' });
});

export const updateFormTemplate = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const template = await adminFeaturesService.updateFormTemplate(req.params.id, req.body);
  res.json({ success: true, data: template, message: 'Template de formulaire mis à jour' });
});

export const deleteFormTemplate = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  await adminFeaturesService.deleteFormTemplate(req.params.id);
  res.json({ success: true, data: null, message: 'Template de formulaire supprimé' });
});

export const activateFormTemplate = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const template = await adminFeaturesService.activateFormTemplate(req.params.id);
  res.json({ success: true, data: template, message: 'Template de formulaire activé' });
});

export const getFormSubmissions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const submissions = await adminFeaturesService.getFormSubmissions(req.params.templateId);
  res.json({ success: true, data: submissions });
});

export const getFormSubmission = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const submission = await adminFeaturesService.getFormSubmission(req.params.id);
  res.json({ success: true, data: submission });
});

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

export const getNotificationTemplates = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { type, channel } = req.query as any;
  const templates = await adminFeaturesService.getNotificationTemplates({ type, channel });
  res.json({ success: true, data: templates });
});

export const getNotificationTemplate = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const tpl = await adminFeaturesService.getNotificationTemplate(req.params.id);
  res.json({ success: true, data: tpl });
});

export const createNotificationTemplate = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const tpl = await adminFeaturesService.createNotificationTemplate(req.body);
  res.json({ success: true, data: tpl, message: 'Template de notification créé' });
});

export const updateNotificationTemplate = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const tpl = await adminFeaturesService.updateNotificationTemplate(req.params.id, req.body);
  res.json({ success: true, data: tpl, message: 'Template de notification mis à jour' });
});

export const deleteNotificationTemplate = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  await adminFeaturesService.deleteNotificationTemplate(req.params.id);
  res.json({ success: true, data: null, message: 'Template de notification supprimé' });
});

export const getNotificationTypes = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const types = await adminFeaturesService.getNotificationTypes();
  res.json({ success: true, data: types });
});

export const getNotificationChannels = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const channels = await adminFeaturesService.getNotificationChannels();
  res.json({ success: true, data: channels });
});

// ============================================
// COPILOT CONFIGURATION
// ============================================

export const getPlatformCopilotConfig = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const config = await adminFeaturesService.getPlatformCopilotConfig();
  res.json({ success: true, data: config });
});

export const updatePlatformCopilotConfig = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const config = await adminFeaturesService.updatePlatformCopilotConfig(req.body);
  res.json({ success: true, data: config, message: 'Configuration copilot mise à jour' });
});

export const getBusinessCopilotConfig = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const config = await adminFeaturesService.getBusinessCopilotConfig(req.params.businessId);
  res.json({ success: true, data: config });
});

export const updateBusinessCopilotConfig = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const config = await adminFeaturesService.updateBusinessCopilotConfig(req.params.businessId, req.body);
  res.json({ success: true, data: config, message: 'Configuration copilot business mise à jour' });
});

// ============================================
// MEDIA MODERATION
// ============================================

export const getMediaModerationItems = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { contentType, status } = req.query as any;
  const items = await adminFeaturesService.getMediaModerationItems({ contentType, status });
  res.json({ success: true, data: items });
});

export const getMediaModerationItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const item = await adminFeaturesService.getMediaModerationItem(req.params.id);
  res.json({ success: true, data: item });
});

export const reportMedia = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { contentType, contentId, reason, description } = req.body;
  const item = await adminFeaturesService.reportMedia(contentType, contentId, req.user!.id, reason, description);
  res.json({ success: true, data: item, message: 'Contenu signalé' });
});

export const approveMedia = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const item = await adminFeaturesService.approveMedia(req.params.id, req.user!.id);
  res.json({ success: true, data: item, message: 'Contenu approuvé' });
});

export const rejectMedia = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { reason } = req.body;
  const item = await adminFeaturesService.rejectMedia(req.params.id, req.user!.id, reason);
  res.json({ success: true, data: item, message: 'Contenu rejeté' });
});

export const flagMedia = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { reason } = req.body;
  const item = await adminFeaturesService.flagMedia(req.params.id, req.user!.id, reason);
  res.json({ success: true, data: item, message: 'Contenu signalé pour examen' });
});

export const getModerationStats = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const stats = await adminFeaturesService.getModerationStats();
  res.json({ success: true, data: stats });
});

// ============================================
// COMMISSION CONFIGURATION
// ============================================

export const getCommissionConfigs = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const configs = await adminFeaturesService.getCommissionConfigs();
  res.json({ success: true, data: configs });
});

export const getCommissionConfig = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const config = await adminFeaturesService.getCommissionConfig(req.params.key);
  res.json({ success: true, data: config });
});

export const createCommissionConfig = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const config = await adminFeaturesService.createCommissionConfig(req.body);
  res.json({ success: true, data: config, message: 'Commission config créée' });
});

export const updateCommissionConfig = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const config = await adminFeaturesService.updateCommissionConfig(req.params.id, req.body);
  res.json({ success: true, data: config, message: 'Commission config mise à jour' });
});

export const deleteCommissionConfig = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  await adminFeaturesService.deleteCommissionConfig(req.params.id);
  res.json({ success: true, data: null, message: 'Commission config supprimée' });
});

// ============================================
// USER WARNINGS
// ============================================

export const getUserWarnings = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const warnings = await adminFeaturesService.getUserWarnings(req.params.userId);
  res.json({ success: true, data: warnings });
});

export const issueWarning = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { reason, description, action } = req.body;
  const warning = await adminFeaturesService.issueWarning(req.params.userId, req.user!.id, reason, description, action);
  res.json({ success: true, data: warning, message: 'Avertissement émis' });
});

export const revokeWarning = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  await adminFeaturesService.revokeWarning(req.params.id);
  res.json({ success: true, data: null, message: 'Avertissement révoqué' });
});

export const getAllWarnings = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { userId } = req.query as any;
  const warnings = await adminFeaturesService.getAllWarnings({ userId });
  res.json({ success: true, data: warnings });
});

// ============================================
// SUBSCRIPTION PLANS
// ============================================

export const getAllSubscriptionPlans = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const plans = await adminFeaturesService.getAllSubscriptionPlans();
  res.json({ success: true, data: plans });
});

export const getSubscriptionPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const plan = await adminFeaturesService.getSubscriptionPlan(req.params.id);
  res.json({ success: true, data: plan });
});

export const createSubscriptionPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const plan = await adminFeaturesService.createSubscriptionPlan(req.body);
  res.json({ success: true, data: plan, message: 'Plan d\'abonnement créé' });
});

export const updateSubscriptionPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const plan = await adminFeaturesService.updateSubscriptionPlan(req.params.id, req.body);
  res.json({ success: true, data: plan, message: 'Plan d\'abonnement mis à jour' });
});

export const deleteSubscriptionPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  await adminFeaturesService.deleteSubscriptionPlan(req.params.id);
  res.json({ success: true, data: null, message: 'Plan d\'abonnement supprimé' });
});

export const addPlanPrivilege = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const priv = await adminFeaturesService.addPlanPrivilege(req.params.id, req.body);
  res.json({ success: true, data: priv, message: 'Privilège ajouté' });
});

export const updatePlanPrivilege = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const priv = await adminFeaturesService.updatePlanPrivilege(req.params.id, req.body);
  res.json({ success: true, data: priv, message: 'Privilège mis à jour' });
});

export const removePlanPrivilege = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  await adminFeaturesService.removePlanPrivilege(req.params.id);
  res.json({ success: true, data: null, message: 'Privilège supprimé' });
});

// ============================================
// BACKUPS
// ============================================

export const getBackups = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const backups = await adminFeaturesService.getBackups();
  res.json({ success: true, data: backups });
});

export const createBackup = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminFeaturesService.createBackup();
  res.json({ success: true, data: result, message: 'Sauvegarde créée' });
});

export const restoreBackup = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminFeaturesService.restoreBackup(req.params.id);
  res.json({ success: true, data: result, message: 'Restauration effectuée' });
});

export const getBackupDownloadUrl = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminFeaturesService.getBackupDownloadUrl(req.params.id);
  res.json({ success: true, data: result });
});

export const toggleAutoBackup = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { enabled } = req.body;
  const result = await adminFeaturesService.toggleAutoBackup(enabled);
  res.json({ success: true, data: result, message: 'Sauvegarde automatique ' + (enabled ? 'activée' : 'désactivée') });
});

// ============================================
// AFRI SCORE
// ============================================

export const recomputeAllAfriScores = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminFeaturesService.recomputeAllAfriScores();
  res.json({ success: true, data: result, message: 'Recalcul des scores lancé' });
});

export const getAfriScoreRules = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const rules = await adminFeaturesService.getPlatformSettingsByCategory('afriscore');
  res.json({ success: true, data: rules });
});

export const updateAfriScoreRules = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminFeaturesService.updateAfriScoreRules(req.body);
  res.json({ success: true, data: result, message: 'Règles AfriScore mises à jour' });
});

// ============================================
// MEDIA MANAGEMENT (Stories / Shorts / Lives)
// ============================================

export const getAdminStories = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const stories = await prisma.story.findMany({
    include: { business: { select: { id: true, name: true, slug: true, logo: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ success: true, data: stories });
});

export const updateAdminStoryStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const { status } = req.body;
  const story = await prisma.story.update({
    where: { id },
    data: { isActive: status === 'ACTIF' || status === 'ACTIVE' },
  });
  res.json({ success: true, data: story, message: 'Statut mis à jour' });
});

export const deleteAdminStory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  await prisma.story.delete({ where: { id } });
  await prisma.feedItem.deleteMany({ where: { referenceId: id, type: 'STORY' } });
  res.json({ success: true, message: 'Story supprimée' });
});

export const getAdminShorts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const shorts = await prisma.short.findMany({
    include: { business: { select: { id: true, name: true, slug: true, logo: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ success: true, data: shorts });
});

export const updateAdminShortStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = await prisma.short.update({
    where: { id },
    data: { isActive: status === 'ACTIF' || status === 'ACTIVE' },
  });
  res.json({ success: true, data: updated, message: 'Statut mis à jour' });
});

export const deleteAdminShort = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  await prisma.short.delete({ where: { id } });
  res.json({ success: true, message: 'Short supprimé' });
});

export const getAdminLives = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const lives = await prisma.live.findMany({
    include: { business: { select: { id: true, name: true, slug: true, logo: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ success: true, data: lives });
});

export const updateAdminLiveStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const { status } = req.body;
  const live = await prisma.live.update({
    where: { id },
    data: { status: status as any },
  });
  res.json({ success: true, data: live, message: 'Statut mis à jour' });
});

// ============================================
// PROMO CODES & COUPONS ADMIN
// ============================================

// ============================================
// MONETIZATION AUDIT LOGS
// ============================================

export const getMonetizationAudit = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const logs = await getMonetizationAuditLogs();
  res.json({ success: true, data: logs });
});

// ============================================
// DEVELOPER COMMISSIONS
// ============================================

export const getDeveloperCommissions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const period = (req.query.period as string) || '30d';
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string || '';

  // Build developer where clause
  const devWhere: any = {
    user: {
      roles: { has: 'DEVELOPER' },
    },
  };
  if (search) {
    devWhere.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { user: { firstName: { contains: search, mode: 'insensitive' } } },
      { user: { lastName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [profiles, total] = await Promise.all([
    prisma.developerProfile.findMany({
      where: devWhere,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        modules: {
          where: { status: 'PUBLISHED' },
          select: { id: true, name: true, price: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.developerProfile.count({ where: devWhere }),
  ]);

  const developers = profiles.map((profile) => ({
    id: profile.id,
    name: profile.companyName || `${profile.user.firstName} ${profile.user.lastName}`,
    email: profile.user.email,
    moduleCount: profile.modules.length,
    totalSales: profile.modules.length,
    grossRevenue: profile.modules.reduce((sum, m) => sum + Number(m.price), 0),
    commission: Math.round(profile.modules.reduce((sum, m) => sum + Number(m.price) * 0.20, 0)),
    netRevenue: Math.round(profile.modules.reduce((sum, m) => sum + Number(m.price) * 0.80, 0)),
  }));

  // Global stats
  const totalGross = developers.reduce((sum, d) => sum + d.grossRevenue, 0);
  const totalCommission = developers.reduce((sum, d) => sum + d.commission, 0);

  res.json({
    success: true,
    data: {
      developers,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalDeveloperRevenue: totalGross,
        totalPlatformCommission: totalCommission,
        totalSales: developers.reduce((sum, d) => sum + d.totalSales, 0),
      },
    },
  });
});

// ============================================
// PROMO CODES & COUPONS ADMIN
// ============================================

export const getAdminCoupons = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const coupons = await prisma.coupon.findMany({
    include: {
      business: { select: { id: true, name: true, slug: true } },
      client: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { issuedAt: 'desc' },
    take: 100,
  });
  res.json({ success: true, data: coupons });
});

export const getAdminPromotions = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const promotions = await prisma.promotion.findMany({
    include: { business: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ success: true, data: promotions });
});

export const getAdminCouponStats = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const [totalCoupons, activeCoupons, usedCoupons, expiredCoupons, totalPromotions, activePromotions] = await Promise.all([
    prisma.coupon.count(),
    prisma.coupon.count({ where: { status: 'ACTIVE' } }),
    prisma.coupon.count({ where: { status: 'USED' } }),
    prisma.coupon.count({ where: { status: 'EXPIRED' } }),
    prisma.promotion.count(),
    prisma.promotion.count({ where: { isActive: true } }),
  ]);
  res.json({
    success: true,
    data: { totalCoupons, activeCoupons, usedCoupons, expiredCoupons, totalPromotions, activePromotions },
  });
});

export const disableAdminCoupon = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const coupon = await prisma.coupon.update({
    where: { id: req.params.id },
    data: { status: 'DISABLED' },
  });
  res.json({ success: true, data: coupon, message: 'Code promo désactivé' });
});

// ============================================
// PLATFORM REVENUE STATS
// ============================================

export const getPlatformRevenue = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const period = (req.params.period || req.query.period || '30d') as '7d' | '30d' | '90d' | '1y' | 'all';
  const stats = await getPlatformRevenueStats(period);
  res.json({ success: true, data: stats });
});
