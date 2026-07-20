import type { ApiClientMethods } from './api-client.types';

export function injectAdmin(api: ApiClientMethods) {
  api.adminGetAllAdCampaigns = function (params?: any) {
    return this.get('/admin/ads/campaigns', { params });
  };
  api.adminGetAdStats = function (params?: any) {
    return this.get('/admin/ads/stats', { params });
  };
  api.adminGetAdRevenue = function (params?: any) {
    return this.get('/admin/ads/revenue', { params });
  };
  api.adminValidateAdCampaign = function (id: string) {
    return this.post(`/admin/ads/campaigns/${id}/validate`);
  };
  api.adminRejectAdCampaign = function (id: string, reason?: string) {
    return this.post(`/admin/ads/campaigns/${id}/reject`, { reason });
  };
  api.adminSuspendAdCampaign = function (id: string, reason?: string) {
    return this.post(`/admin/ads/campaigns/${id}/suspend`, { reason });
  };
  api.adminCreateAdPackage = function (data: any) {
    return this.post('/admin/ads/packages', data);
  };
  api.adminGetAdPackages = function () {
    return this.get('/admin/ads/packages');
  };
  api.adminGetPartners = function (params?: any) {
    return this.get('/admin/partners', { params });
  };
  api.adminGetPartnerDetail = function (id: string) {
    return this.get(`/admin/partners/${id}`);
  };
  api.adminApprovePartner = function (id: string) {
    return this.post(`/admin/partners/${id}/approve`);
  };
  api.adminRevokePartner = function (id: string, reason?: string) {
    return this.post(`/admin/partners/${id}/revoke`, { reason });
  };
  api.adminSuspendPartner = function (id: string, reason?: string) {
    return this.post(`/admin/partners/${id}/suspend`, { reason });
  };
  api.searchPartnerBusinesses = function (query: string) {
    return this.get('/admin/partners/search', { params: { q: query } });
  };
  api.adminRecomputeAllScores = function () {
    return this.post('/admin/afriscore/recompute-all');
  };
  api.adminGetDataAccessLogs = function (params?: any) {
    return this.get('/admin/data-access-logs', { params });
  };
  api.adminGetPlatformAnalytics = function (params?: any) {
    return this.get('/admin/analytics', { params });
  };
  api.adminGetReports = function (params?: any) {
    return this.get('/admin/reports', { params });
  };
}
