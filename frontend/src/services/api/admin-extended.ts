import type { ApiClientMethods } from './api-client.types';

export function injectAdminExtended(api: ApiClientMethods) {
  api.adminGetWarningStats = function () {
    return this.get('/admin/warnings/stats');
  };
  api.adminGetUserDetail = function (id: string) {
    return this.get('/admin/users/' + id);
  };
  api.adminGetUserActivity = function (id: string) {
    return this.get('/admin/users/' + id + '/activity');
  };
  api.adminGetUserSessions = function (id: string) {
    return this.get('/admin/users/' + id + '/sessions');
  };
  api.adminGetUserPayments = function (id: string) {
    return this.get('/admin/users/' + id + '/payments');
  };
  api.adminGetUserReports = function (id: string) {
    return this.get('/admin/users/' + id + '/reports');
  };
  api.updateUserStatus = function (id: string, action: string) {
    return this.put('/admin/users/' + id + '/status', { action });
  };
  api.adminGetSupportTickets = function (params?: any) {
    return this.get('/admin/support/tickets', { params });
  };
  api.adminGetSupportStats = function () {
    return this.get('/admin/support/stats');
  };
  api.updateSupportTicketStatus = function (id: string, action: string) {
    return this.put('/admin/support/tickets/' + id + '/' + action);
  };

  // ============================================
  // SECURITY
  // ============================================
  api.adminGetSecurityStats = function () {
    return this.get('/admin/security/stats');
  };
  api.adminGetSecurityAdmins = function (params?: any) {
    return this.get('/admin/security/admins', { params });
  };
  api.adminGetSecuritySessions = function (params?: any) {
    return this.get('/admin/security/sessions', { params });
  };
  api.adminGetSecurityAttempts = function (params?: any) {
    return this.get('/admin/security/attempts', { params });
  };
  api.adminGetBlacklist = function (params?: any) {
    return this.get('/admin/security/blacklist', { params });
  };
  api.adminGetSecurityJournal = function (params?: any) {
    return this.get('/admin/security/journal', { params });
  };
  api.adminDeleteSecuritySession = function (sessionId: string) {
    return this.delete('/admin/security/sessions/' + sessionId);
  };
  api.adminAddToBlacklist = function (data: { ip: string }) {
    return this.post('/admin/security/blacklist', data);
  };
  api.adminRemoveFromBlacklist = function (ip: string) {
    return this.delete('/admin/security/blacklist/' + ip);
  };

  // ============================================
  // ROLES
  // ============================================
  api.adminGetRoles = function () {
    return this.get('/admin/roles');
  };
  api.adminGetUsersAdmins = function () {
    return this.get('/admin/users/admins');
  };
  api.adminCreateRole = function (data: any) {
    return this.post('/admin/roles', data);
  };
  api.adminAssignRole = function (data: { roleId: string; userId: string }) {
    return this.post('/admin/roles/assign', data);
  };
  api.adminUnassignRole = function (data: { roleId: string; userId: string }) {
    return this.post('/admin/roles/unassign', data);
  };

  // ============================================
  // SETTINGS
  // ============================================
  api.adminGetSettings = function () {
    return this.get('/admin/settings');
  };
  api.adminGetVerificationSettings = function () {
    return this.get('/admin/settings/verification');
  };
  api.adminUpdateSettings = function (data: any) {
    return this.put('/admin/settings', data);
  };
  api.adminUpdateVerificationSettings = function (data: { mode: string }) {
    return this.put('/admin/settings/verification', data);
  };

  // ============================================
  // WARNINGS
  // ============================================
  api.adminGetWarnings = function (params?: any) {
    return this.get('/admin/warnings', { params });
  };
  api.adminCreateWarning = function (userId: string, data: any) {
    return this.post('/admin/users/' + userId + '/warnings', data);
  };
  api.adminDeleteWarning = function (id: string) {
    return this.delete('/admin/warnings/' + id);
  };

  // ============================================
  // USERS
  // ============================================
  api.adminGetUsers = function (params?: any) {
    return this.get('/admin/users', { params });
  };
  api.adminSearchUsers = function (params?: any) {
    return this.get('/admin/users', { params });
  };

  // ============================================
  // ESCROW
  // ============================================
  api.adminGetEscrowList = function (params?: any) {
    return this.get('/admin/escrow', { params });
  };
  api.adminGetEscrowStats2 = function () {
    return this.get('/admin/escrow/stats');
  };
  api.adminReleaseEscrow2 = function (id: string) {
    return this.post('/admin/escrow/' + id + '/release');
  };
  api.adminRefundEscrow2 = function (id: string) {
    return this.post('/admin/escrow/' + id + '/refund');
  };
  api.adminArbitrateEscrow = function (id: string, decision: string) {
    return this.post('/admin/escrow/' + id + '/arbitrate', { decision });
  };

  // ============================================
  // DISPUTES
  // ============================================
  api.adminGetDisputes2 = function (params?: any) {
    return this.get('/admin/disputes', { params });
  };
  api.adminGetDisputeStats2 = function () {
    return this.get('/admin/disputes/stats');
  };
  api.adminUpdateDisputeStatus = function (id: string, action: string) {
    return this.put('/admin/disputes/' + id + '/' + action);
  };

  // ============================================
  // DEVELOPERS
  // ============================================
  api.adminGetDevelopers = function (params?: any) {
    return this.get('/admin/developers', { params });
  };
  api.adminGetDeveloperDetail = function (id: string) {
    return this.get('/admin/developers/' + id);
  };
  api.adminUpdateDeveloperStatus = function (id: string, action: string) {
    return this.put('/admin/developers/' + id + '/status', { action });
  };
  api.adminGetDeveloperCommissions = function (params?: any) {
    return this.get('/admin/developers/commissions', { params });
  };

  // ============================================
  // CMS
  // ============================================
  api.adminGetCMSPages = function () {
    return this.get('/admin/cms/pages');
  };
  api.adminGetCMSCategories = function () {
    return this.get('/admin/cms/categories');
  };
  api.adminCreateCMSPage = function (data: any) {
    return this.post('/admin/cms/pages', data);
  };
  api.adminUpdateCMSPage = function (id: string, data: any) {
    return this.put('/admin/cms/pages/' + id, data);
  };
  api.adminDeleteCMSPage = function (id: string) {
    return this.delete('/admin/cms/pages/' + id);
  };
  api.adminPublishCMSPage = function (id: string) {
    return this.post('/admin/cms/pages/' + id + '/publish');
  };
  api.adminCreateCMSCategory = function (data: any) {
    return this.post('/admin/cms/categories', data);
  };
  api.adminUpdateCMSCategory = function (id: string, data: any) {
    return this.put('/admin/cms/categories/' + id, data);
  };
  api.adminDeleteCMSCategory = function (id: string) {
    return this.delete('/admin/cms/categories/' + id);
  };

  // ============================================
  // FRAUD REPORTS
  // ============================================
  api.adminGetFraudReports = function (params?: any) {
    return this.get('/admin/reports/fraud', { params });
  };
  api.adminApproveFraudReport = function (id: string) {
    return this.post('/admin/reports/fraud/' + id + '/approve');
  };
  api.adminRejectFraudReport = function (id: string) {
    return this.post('/admin/reports/fraud/' + id + '/reject');
  };
  api.adminBanFraudReport = function (id: string) {
    return this.post('/admin/reports/fraud/' + id + '/ban');
  };

  // ============================================
  // DEMANDS
  // ============================================
  api.adminGetDemands = function (params?: any) {
    return this.get('/admin/demands', { params });
  };
  api.adminUpdateDemandStatus = function (id: string, data: { status: string }) {
    return this.put('/admin/demands/' + id + '/status', data);
  };
  api.adminAutoMatchDemand = function (id: string) {
    return this.post('/admin/demands/' + id + '/auto-match');
  };
  api.adminUpdateMatchStatus = function (matchId: string, data: { status: string }) {
    return this.put('/admin/matches/' + matchId + '/status', data);
  };
  api.adminGetMatchesForDemand = function (demandId: string) {
    return this.get('/admin/demands/' + demandId + '/matches');
  };

  // ============================================
  // CAMPAIGNS
  // ============================================
  api.adminGetCampaigns = function (params?: any) {
    return this.get('/admin/campaigns', { params });
  };
  api.adminCreateCampaign = function (data: any) {
    return this.post('/admin/campaigns', data);
  };
  api.adminUpdateCampaign = function (id: string, data: any) {
    return this.put('/admin/campaigns/' + id, data);
  };
  api.adminDeleteCampaign = function (id: string) {
    return this.delete('/admin/campaigns/' + id);
  };
  api.adminStartCampaign = function (id: string) {
    return this.post('/admin/campaigns/' + id + '/start');
  };

  // ============================================
  // REPORTS
  // ============================================
  api.adminGetReportData = function (tab: string, params?: any) {
    return this.get('/admin/reports/' + tab, { params });
  };

  // ============================================
  // PROMOS
  // ============================================
  api.adminGetPromoStats = function () {
    return this.get('/admin/promos/stats');
  };
  api.adminGetPromoCoupons = function () {
    return this.get('/admin/promos/coupons');
  };
  api.adminGetPromoPromotions = function () {
    return this.get('/admin/promos/promotions');
  };
  api.adminDisableCoupon = function (id: string) {
    return this.patch('/admin/promos/coupons/' + id + '/disable');
  };

  // ============================================
  // BACKUPS
  // ============================================
  api.adminGetBackups = function (params?: any) {
    return this.get('/admin/backups', { params });
  };
  api.adminCreateBackup = function () {
    return this.post('/admin/backups');
  };
  api.adminRestoreBackup = function (id: string) {
    return this.post('/admin/backups/' + id + '/restore');
  };
  api.adminToggleAutoBackup = function (enabled: boolean) {
    return this.put('/admin/backups/auto', { enabled });
  };
  api.adminDownloadBackup = function (id: string) {
    return this.get('/admin/backups/' + id + '/download', { responseType: 'blob' });
  };

  // ============================================
  // NOTIFICATIONS
  // ============================================
  api.adminGetNotificationsList = function (params?: any) {
    return this.get('/admin/notifications', { params });
  };

  // ============================================
  // BUSINESSES
  // ============================================
  api.adminGetBusinesses = function (params?: any) {
    return this.get('/admin/businesses', { params });
  };
  api.adminGetBusinessDetail = function (id: string) {
    return this.get('/admin/businesses/' + id);
  };
  api.adminUpdateBusinessStatus = function (id: string, action: string) {
    return this.put('/admin/businesses/' + id + '/status', { action });
  };

  // ============================================
  // FINANCE
  // ============================================
  api.adminGetFinanceOverview = function () {
    return this.get('/admin/finance/overview');
  };
  api.adminGetFinanceTransactions = function (params?: any) {
    return this.get('/admin/finance/transactions', { params });
  };
  api.adminGetFinanceEscrows = function (params?: any) {
    return this.get('/admin/finance/escrows', { params });
  };
  api.adminGetFinanceFraudAlerts = function () {
    return this.get('/admin/finance/fraud-alerts');
  };
  api.adminGetFinanceDebtRecovery = function () {
    return this.get('/admin/finance/debt-recovery');
  };

  // ============================================
  // REVIEWS
  // ============================================
  api.adminGetReviews2 = function (params?: any) {
    return this.get('/admin/reviews', { params });
  };
  api.adminUpdateReviewStatus = function (id: string, action: string) {
    return this.put('/admin/reviews/' + id + '/' + action);
  };
  api.adminDeleteReview2 = function (id: string) {
    return this.delete('/admin/reviews/' + id);
  };

  // ============================================
  // REVENUE
  // ============================================
  api.adminGetRevenueStats = function (period?: string) {
    const url = period ? '/admin/revenue/stats?period=' + period : '/admin/revenue/stats';
    return this.get(url);
  };

  // ============================================
  // FEATURE FLAGS
  // ============================================
  api.adminGetFeatureFlags = function (params?: any) {
    return this.get('/admin/feature-flags', { params });
  };
  api.adminCreateFeatureFlag = function (data: any) {
    return this.post('/admin/feature-flags', data);
  };
  api.adminUpdateFeatureFlag = function (id: string, data: any) {
    return this.put('/admin/feature-flags/' + id, data);
  };
  api.adminDeleteFeatureFlag = function (id: string) {
    return this.delete('/admin/feature-flags/' + id);
  };
  api.adminToggleFeatureFlag = function (id: string) {
    return this.patch('/admin/feature-flags/' + id + '/toggle');
  };

  // ============================================
  // DASHBOARD
  // ============================================
  api.adminGetDashboardStats = function () {
    return this.get('/admin/dashboard/stats');
  };

  // ============================================
  // DATA
  // ============================================
  api.adminExportData = function (data: any) {
    return this.post('/admin/data/export', data);
  };
  api.adminPurgeData = function (data: any) {
    return this.post('/admin/data/purge', data);
  };

  // ============================================
  // STATISTICS
  // ============================================
  api.adminGetStatistics = function (params?: any) {
    return this.get('/admin/statistics', { params });
  };

  // Moderation
  api.adminReportModeration = function (data: any) {
    return this.post('/admin/moderation/report', data);
  };
}
