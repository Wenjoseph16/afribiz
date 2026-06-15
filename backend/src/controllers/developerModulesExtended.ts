import { Request, Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as permissionsService from '../services/developerPermissions';
import * as licensesService from '../services/developerLicenses';
import * as configurationService from '../services/developerConfiguration';
import * as apiService from '../services/developerApi';
import * as analyticsService from '../services/developerAnalytics';
import * as validationService from '../services/developerValidation';
import * as activityLogService from '../services/developerActivityLog';
import { DeveloperRepository } from '../repositories/developerRepository';

// ============================================
// PERMISSIONS CONTROLLERS
// ============================================

export const getModulePermissions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const permissions = await permissionsService.getModulePermissions(id);
  res.json({ success: true, data: permissions });
});

export const addModulePermission = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const permission = await permissionsService.addModulePermission(req.user.id, id, req.body);
  res.status(201).json({ success: true, data: permission, message: 'Permission ajoutée avec succès' });
});

export const removeModulePermission = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const result = await permissionsService.removeModulePermission(req.user.id, id);
  res.json({ success: true, data: result, message: 'Permission supprimée avec succès' });
});

export const checkModulePermissions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const businessId = req.query.businessId as string;
  if (!businessId) return res.status(400).json({ success: false, error: 'businessId requis' });
  const result = await permissionsService.checkModulePermissions(id, businessId);
  res.json({ success: true, data: result });
});

export const getPermissionSummary = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const summary = await permissionsService.getPermissionSummary(id);
  res.json({ success: true, data: summary });
});

// ============================================
// LICENSES CONTROLLERS
// ============================================

export const createLicense = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const license = await licensesService.createLicense(req.body.moduleId, req.body.businessId, req.body);
  res.status(201).json({ success: true, data: license, message: 'Licence créée avec succès' });
});

export const activateLicense = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { licenseKey } = req.body;
  if (!licenseKey) return res.status(400).json({ success: false, error: 'Clé de licence requise' });
  const license = await licensesService.activateLicense(licenseKey);
  res.json({ success: true, data: license, message: 'Licence activée avec succès' });
});

// ============================================
// API KEYS CONTROLLERS
// ============================================

export const createApiKey = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const key = await apiService.createApiKey(req.user.id, req.body);
  res.status(201).json({ success: true, data: key, message: 'Clé API créée avec succès' });
});

export const getApiKeys = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const keys = await apiService.getApiKeys(req.user.id);
  res.json({ success: true, data: keys });
});

export const revokeApiKey = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const key = await apiService.revokeApiKey(req.user.id, id);
  res.json({ success: true, data: key, message: 'Clé API révoquée avec succès' });
});

// ============================================
// WEBHOOKS CONTROLLERS
// ============================================

export const createWebhook = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const webhook = await apiService.createWebhook(req.user.id, req.body);
  res.status(201).json({ success: true, data: webhook, message: 'Webhook créé avec succès' });
});

export const getWebhooks = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const webhooks = await apiService.getWebhooks(req.user.id);
  res.json({ success: true, data: webhooks });
});

export const deleteWebhook = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const result = await apiService.deleteWebhook(req.user.id, id);
  res.json({ success: true, data: result, message: 'Webhook supprimé avec succès' });
});

export const getWebhookDeliveries = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const deliveries = await apiService.getWebhookDeliveries(id, limit);
  res.json({ success: true, data: deliveries });
});

export const revokeLicense = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const { reason } = req.body;
  const license = await licensesService.revokeLicense(req.user.id, id, reason);
  res.json({ success: true, data: license, message: 'Licence révoquée avec succès' });
});

export const renewLicense = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { durationDays } = req.body;
  const license = await licensesService.renewLicense(id, durationDays || 365);
  res.json({ success: true, data: license, message: 'Licence renouvelée avec succès' });
});

export const checkLicense = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const moduleId = req.query.moduleId as string;
  const businessId = req.query.businessId as string;
  if (!moduleId || !businessId) {
    return res.status(400).json({ success: false, error: 'moduleId et businessId requis' });
  }
  const result = await licensesService.checkLicense(moduleId, businessId);
  res.json({ success: true, data: result });
});

export const getModuleLicenses = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const licenses = await licensesService.getModuleLicenses(id);
  res.json({ success: true, data: licenses });
});

export const getBusinessLicenses = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { businessId } = req.params;
  const licenses = await licensesService.getBusinessLicenses(businessId);
  res.json({ success: true, data: licenses });
});

export const getLicenseStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const profile = await DeveloperRepository.findByUserId(req.user.id);
  if (!profile) return res.status(404).json({ success: false, error: 'Profil développeur non trouvé' });
  const stats = await licensesService.getLicenseStats(profile.id);
  res.json({ success: true, data: stats });
});

// ============================================
// ANALYTICS & ERROR CONTROLLERS
// ============================================

export const trackAnalytics = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const result = await analyticsService.trackAnalytics(id, req.body);
  res.json({ success: true, data: result, message: 'Analytique enregistrée' });
});

export const getModuleAnalytics = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  const analytics = await analyticsService.getModuleAnalytics(id, startDate, endDate);
  res.json({ success: true, data: analytics });
});

export const logModuleError = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const errorLog = await analyticsService.logModuleError(id, req.body);
  res.status(201).json({ success: true, data: errorLog, message: 'Erreur enregistrée' });
});

export const getModuleErrors = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const resolved = req.query.resolved !== undefined ? req.query.resolved === 'true' : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const errors = await analyticsService.getModuleErrors(id, resolved, limit);
  res.json({ success: true, data: errors });
});

export const resolveError = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const result = await analyticsService.resolveError(id);
  res.json({ success: true, data: result, message: 'Erreur résolue' });
});

// ============================================
// VALIDATION CONTROLLERS
// ============================================

export const submitForValidation = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const validation = await validationService.submitForValidation(req.user.id, id);
  res.status(201).json({ success: true, data: validation, message: 'Module soumis à validation' });
});

export const approveValidationCheck = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { score, details } = req.body;
  const check = await validationService.approveValidationCheck(id, score, details);
  res.json({ success: true, data: check, message: 'Check validé' });
});

export const rejectValidationCheck = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { details } = req.body;
  const check = await validationService.rejectValidationCheck(id, details);
  res.json({ success: true, data: check, message: 'Check rejeté' });
});

export const completeValidation = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const { status, notes } = req.body;
  const validation = await validationService.completeValidation(id, req.user.id, status, notes);
  res.json({ success: true, data: validation, message: 'Validation terminée' });
});

export const getModuleValidation = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const validation = await validationService.getModuleValidation(id);
  res.json({ success: true, data: validation });
});

export const getPendingValidations = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const validations = await validationService.getPendingValidations();
  res.json({ success: true, data: validations });
});

export const getValidationHistory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const history = await validationService.getValidationHistory(id);
  res.json({ success: true, data: history });
});

// ============================================
// CONFIGURATION CONTROLLERS
// ============================================

export const saveModuleConfiguration = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { businessId, installationId, settings } = req.body;
  if (!businessId || !installationId) {
    return res.status(400).json({ success: false, error: 'businessId et installationId requis' });
  }
  const config = await configurationService.saveModuleConfiguration(id, businessId, installationId, settings);
  res.json({ success: true, data: config, message: 'Configuration sauvegardée' });
});

export const getModuleConfiguration = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const businessId = req.query.businessId as string;
  if (!businessId) return res.status(400).json({ success: false, error: 'businessId requis' });
  const config = await configurationService.getModuleConfiguration(id, businessId);
  res.json({ success: true, data: config });
});

export const toggleModuleActive = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { businessId, isActive } = req.body;
  if (!businessId) return res.status(400).json({ success: false, error: 'businessId requis' });
  const config = await configurationService.toggleModuleActive(id, businessId, isActive);
  res.json({ success: true, data: config, message: isActive ? 'Module activé' : 'Module désactivé' });
});

export const getModuleConfigurations = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const configs = await configurationService.getModuleConfigurations(id);
  res.json({ success: true, data: configs });
});

export const getBusinessModules = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { businessId } = req.params;
  const modules = await configurationService.getBusinessModules(businessId);
  res.json({ success: true, data: modules });
});

// ============================================
// ACTIVITY LOG CONTROLLERS
// ============================================

export const logActivity = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const { activityType, ...rest } = req.body;
  const activity = await activityLogService.logActivity(req.user.id, id, activityType, rest);
  res.status(201).json({ success: true, data: activity, message: 'Activité enregistrée' });
});

export const getModuleActivity = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const activity = await activityLogService.getModuleActivity(id, limit);
  res.json({ success: true, data: activity });
});

export const getDeveloperActivityFeed = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const profile = await DeveloperRepository.findByUserId(req.user.id);
  if (!profile) return res.status(404).json({ success: false, error: 'Profil développeur non trouvé' });
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const activity = await activityLogService.getDeveloperActivity(profile.id, limit);
  res.json({ success: true, data: activity });
});

export const getBusinessActivityFeed = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { businessId } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const activity = await activityLogService.getBusinessActivity(businessId, limit);
  res.json({ success: true, data: activity });
});

export const getActivityStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const stats = await activityLogService.getActivityStats(id);
  res.json({ success: true, data: stats });
});

// ============================================
// ANALYTICS OVERVIEW (Developer dashboard)
// ============================================

export const getDeveloperAnalyticsOverview = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const profile = await DeveloperRepository.findByUserId(req.user.id);
  if (!profile) return res.status(404).json({ success: false, error: 'Profil développeur non trouvé' });
  const overview = await analyticsService.getDeveloperAnalyticsOverview(profile.id);
  res.json({ success: true, data: overview });
});
