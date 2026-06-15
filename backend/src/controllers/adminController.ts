import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as adminService from '../services/adminService';

export const getDashboardStats = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const stats = await adminService.getDashboardStats();
  res.json({ success: true, data: stats });
});

export const getUsers = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { search, role, status } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getUsers({
    search: search as string,
    role: role as string,
    status: status as string,
    page,
    limit,
  });
  res.json({ success: true, data: result });
});

export const getUserById = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const user = await adminService.getUserById(req.params.id);
  res.json({ success: true, data: user });
});

export const updateUserStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { action } = req.body;
  const user = await adminService.updateUserStatus(req.params.id, action);
  res.json({ success: true, data: user, message: 'Statut mis à jour' });
});

export const getUserActivity = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const activity = await adminService.getUserActivity(req.params.id);
  res.json({ success: true, data: activity });
});

export const getBusinesses = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { search, status, verified } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getBusinesses({
    search: search as string,
    status: status as string,
    verified: verified as string,
    page,
    limit,
  });
  res.json({ success: true, data: result });
});

export const getBusinessById = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const business = await adminService.getBusinessById(req.params.id);
  res.json({ success: true, data: business });
});

export const updateBusinessStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { action } = req.body;
  const business = await adminService.updateBusinessStatus(req.params.id, action);
  res.json({ success: true, data: business, message: 'Statut mis à jour' });
});

export const updateBusinessVerification = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { action, rejectionReason } = req.body;
  const business = await adminService.updateBusinessVerification(req.params.id, action, rejectionReason);
  res.json({ success: true, data: business, message: action === 'verify' ? 'Commerce vérifié avec succès' : 'Commerce refusé' });
});

export const getDevelopers = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { search, status, verified } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getDevelopers({
    search: search as string,
    status: status as string,
    verified: verified as string,
    page,
    limit,
  });
  res.json({ success: true, data: result });
});

export const getDeveloperById = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const developer = await adminService.getDeveloperById(req.params.id);
  res.json({ success: true, data: developer });
});

export const updateDeveloperStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { action } = req.body;
  const developer = await adminService.updateDeveloperStatus(req.params.id, action);
  res.json({ success: true, data: developer, message: 'Statut mis à jour' });
});

export const getModules = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { search, status } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getModules({
    search: search as string,
    status: status as string,
    page,
    limit,
  });
  res.json({ success: true, data: result });
});

export const updateModuleStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { action } = req.body;
  const mod = await adminService.updateModuleStatus(req.params.id, action);
  res.json({ success: true, data: mod, message: 'Statut mis à jour' });
});

export const getPayments = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { status } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getPayments({
    status: status as string,
    page,
    limit,
  });
  res.json({ success: true, data: result });
});

export const getEscrows = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { status } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getEscrows({
    status: status as string,
    page,
    limit,
  });
  res.json({ success: true, data: result });
});

export const getSubscriptions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { status } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getSubscriptions({
    status: status as string,
    page,
    limit,
  });
  res.json({ success: true, data: result });
});

// ============================================
// ESCROW ADMIN
// ============================================

export const getAdminEscrows = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { status } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getAdminEscrows({ status: status as string, page, limit });
  res.json({ success: true, data: result });
});

export const getAdminEscrowStats = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const stats = await adminService.getAdminEscrowStats();
  res.json({ success: true, data: stats });
});

export const releaseAdminEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.releaseAdminEscrow(req.params.id);
  res.json({ success: true, data: result, message: 'Fonds libérés' });
});

export const refundAdminEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.refundAdminEscrow(req.params.id);
  res.json({ success: true, data: result, message: 'Remboursement effectué' });
});

export const arbitrateAdminEscrow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { decision } = req.body;
  const result = await adminService.arbitrateAdminEscrow(req.params.id, decision);
  res.json({ success: true, data: result, message: 'Arbitrage effectué' });
});

// ============================================
// PAYMENTS ADMIN STATS & ACTIONS
// ============================================

export const getAdminPaymentStats = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const stats = await adminService.getAdminPaymentStats();
  res.json({ success: true, data: stats });
});

export const validatePayment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.validatePayment(req.params.id);
  res.json({ success: true, data: result, message: 'Paiement validé' });
});

export const refundPayment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.refundPayment(req.params.id);
  res.json({ success: true, data: result, message: 'Remboursement effectué' });
});

// ============================================
// SUBSCRIPTIONS ADMIN STATS & ACTIONS
// ============================================

export const getAdminSubscriptionStats = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const stats = await adminService.getAdminSubscriptionStats();
  res.json({ success: true, data: stats });
});

export const cancelAdminSubscription = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.cancelAdminSubscription(req.params.id);
  res.json({ success: true, data: result, message: 'Abonnement résilié' });
});

export const renewAdminSubscription = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.renewAdminSubscription(req.params.id);
  res.json({ success: true, data: result, message: 'Abonnement renouvelé' });
});

// ============================================
// SECURITY ADMIN
// ============================================

export const getAdminSecurityStats = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const stats = await adminService.getAdminSecurityStats();
  res.json({ success: true, data: stats });
});

export const getAdminSecurityAdmins = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const result = await adminService.getAdminSecurityAdmins({ page, limit });
  res.json({ success: true, data: result });
});

export const getAdminSecuritySessions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const result = await adminService.getAdminSecuritySessions({ page, limit });
  res.json({ success: true, data: result });
});

export const revokeAdminSession = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  await adminService.revokeAdminSession(req.params.id);
  res.json({ success: true, data: null, message: 'Session révoquée' });
});

export const getAdminSecurityAttempts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const result = await adminService.getAdminSecurityAttempts({ page, limit });
  res.json({ success: true, data: result });
});

export const getAdminSecurityBlacklist = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const result = await adminService.getAdminSecurityBlacklist({ page, limit });
  res.json({ success: true, data: result });
});

export const blockAdminSecurityIp = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { ip } = req.body;
  const result = await adminService.blockAdminSecurityIp(ip);
  res.json({ success: true, data: result, message: `IP ${ip} bloquée` });
});

export const unblockAdminSecurityIp = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.unblockAdminSecurityIp(req.params.ip);
  res.json({ success: true, data: result, message: `IP débloquée` });
});

export const getAdminSecurityJournal = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const result = await adminService.getAdminSecurityJournal({ page, limit });
  res.json({ success: true, data: result });
});

// ============================================
// DISPUTES ADMIN STATS & ACTIONS
// ============================================

export const getDisputesStats = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const stats = await adminService.getDisputesStats();
  res.json({ success: true, data: stats });
});

export const updateDisputeStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { action } = req.params;
  const result = await adminService.updateDisputeStatus(req.params.id, action as 'decide' | 'close');
  res.json({ success: true, data: result, message: 'Statut du litige mis à jour' });
});

// ============================================
// MARKETPLACE ADMIN
// ============================================

export const getAdminMarketplaceItems = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { type } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await adminService.getAdminMarketplaceItems(type, { page, limit });
  res.json({ success: true, data: result });
});

export const updateAdminMarketplaceItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { type, id, action } = req.params;
  const result = await adminService.updateAdminMarketplaceItem(type, id, action as 'feature' | 'unfeature');
  res.json({ success: true, data: result, message: 'Mis à jour' });
});

// ============================================
// ADS ADMIN
// ============================================

export const getAdminAdCampaigns = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { status, search } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getAdminAdCampaigns({ status: status as string, search: search as string, page, limit });
  res.json({ success: true, data: result });
});

export const getAdminAdStats = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const stats = await adminService.getAdminAdStats();
  res.json({ success: true, data: stats });
});

export const getAdminAdRevenue = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const revenue = await adminService.getAdminAdRevenue();
  res.json({ success: true, data: revenue });
});

export const validateAdminAdCampaign = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.validateAdminAdCampaign(req.params.id);
  res.json({ success: true, data: result, message: 'Campagne validée' });
});

export const rejectAdminAdCampaign = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { reason } = req.body;
  const result = await adminService.rejectAdminAdCampaign(req.params.id, reason);
  res.json({ success: true, data: result, message: 'Campagne refusée' });
});

export const suspendAdminAdCampaign = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { reason } = req.body;
  const result = await adminService.suspendAdminAdCampaign(req.params.id, reason);
  res.json({ success: true, data: result, message: 'Campagne suspendue' });
});

// ============================================
// AFRI SCORE ADMIN
// ============================================

export const getAdminAfriScoreStats = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const stats = await adminService.getAdminAfriScoreStats();
  res.json({ success: true, data: stats });
});

export const getAdminAfriScoreRules = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.getAdminAfriScoreRules();
  res.json({ success: true, data: result });
});

export const updateAdminAfriScoreRules = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.updateAdminAfriScoreRules(req.body);
  res.json({ success: true, data: result, message: 'Règles mises à jour' });
});

export const getAdminAfriScoreBadges = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getAdminAfriScoreBadges({ page, limit });
  res.json({ success: true, data: result });
});

export const getAdminAfriScoreHistory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getAdminAfriScoreHistory({ page, limit });
  res.json({ success: true, data: result });
});

export const getAdminAfriScoreAudit = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getAdminAfriScoreAudit({ page, limit });
  res.json({ success: true, data: result });
});

export const recomputeAllAfriScores = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.recomputeAllAfriScores();
  res.json({ success: true, data: result, message: 'Recalcul lancé' });
});

// ============================================
// PARTNERS / DATA HUB ADMIN
// ============================================

export const getAdminPartners = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const result = await adminService.getAdminPartners({ page, limit });
  res.json({ success: true, data: result });
});

export const approveAdminPartner = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.approveAdminPartner(req.params.id);
  res.json({ success: true, data: result, message: 'Partenaire approuvé' });
});

export const suspendAdminPartner = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.suspendAdminPartner(req.params.id);
  res.json({ success: true, data: result, message: 'Partenaire suspendu' });
});

export const revokeAdminPartner = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.revokeAdminPartner(req.params.id);
  res.json({ success: true, data: result, message: 'Accès révoqué' });
});

export const getAdminDataAccessLogs = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const result = await adminService.getAdminDataAccessLogs({ page, limit });
  res.json({ success: true, data: result });
});

export const getAdminPlatformAnalytics = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.getAdminPlatformAnalytics();
  res.json({ success: true, data: result });
});

export const getSupportTickets = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { status, priority } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getSupportTickets({
    status: status as string,
    priority: priority as string,
    page,
    limit,
  });
  res.json({ success: true, data: result });
});

export const getDisputes = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { status } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getDisputes({
    status: status as string,
    page,
    limit,
  });
  res.json({ success: true, data: result });
});

export const getDataReports = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { type, status } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getDataReports({
    type: type as string,
    status: status as string,
    page,
    limit,
  });
  res.json({ success: true, data: result });
});

export const getNotifications = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { type } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getNotifications({
    type: type as string,
    page,
    limit,
  });
  res.json({ success: true, data: result });
});

export const getSecurityLogs = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { action, userId } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getSecurityLogs({
    action: action as string,
    userId: userId as string,
    page,
    limit,
  });
  res.json({ success: true, data: result });
});

export const getSystemLogs = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { module, action } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getSystemLogs({
    module: module as string,
    action: action as string,
    page,
    limit,
  });
  res.json({ success: true, data: result });
});

export const getBackups = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const backups = await adminService.getBackups();
  res.json({ success: true, data: backups });
});

export const createBackup = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { action } = req.body;
  const result = await adminService.createBackup(action || 'manual');
  res.json({ success: true, data: result });
});

export const restoreBackup = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { backupId } = req.body;
  const result = await adminService.restoreBackup(backupId);
  res.json({ success: true, data: result });
});

export const getApiKeys = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getApiKeys({ page, limit });
  res.json({ success: true, data: result });
});

export const getFraudReports = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { status } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getFraudReports({
    status: status as string,
    page,
    limit,
  });
  res.json({ success: true, data: result });
});

export const getPlatformSettings = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const settings = await adminService.getPlatformSettings();
  res.json({ success: true, data: settings });
});

export const updatePlatformSettings = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const result = await adminService.updatePlatformSettings(req.body);
  res.json({ success: true, data: result });
});

export const getAdminAuditLog = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const { adminId, action } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await adminService.getAdminAuditLog({
    adminId: adminId as string,
    action: action as string,
    page,
    limit,
  });
  res.json({ success: true, data: result });
});
