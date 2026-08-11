import type { ApiClientMethods } from './api-client.types';

export function injectMarketplace(api: ApiClientMethods) {
  api.getHomeData = function () {
    return this.get('/home');
  };
  api.searchMarketplace = function (params?: any) {
    return this.get('/marketplace/search', { params });
  };
  api.getTrendingMarketplace = function () {
    return this.get('/marketplace/trending');
  };
  // ⚠️ Le marketplace des MODULES DEVELOPPEURS est monté sur /api/developer/marketplace
  // (router public côté backend) — PAS sur /api/marketplace (router business).
  api.getMarketplaceModules = function (params?: any) {
    return this.get('/developer/marketplace/modules', { params });
  };
  api.getMarketplaceModule = function (slug: string) {
    return this.get(`/developer/marketplace/modules/${slug}`);
  };
  api.getMarketplaceStats = function () {
    return this.get('/marketplace/stats');
  };
  api.getMarketplaceProduct = function (slug: string) {
    return this.get(`/marketplace/product/${slug}`);
  };
  api.getPriceDistribution = function (params?: { type?: string; category?: string }) {
    return this.get('/marketplace/price-distribution', { params });
  };
  api.getSimilarBusinesses = function (businessId: string, limit?: number) {
    return this.get(`/marketplace/similar/${businessId}`, { params: { limit } });
  };
  api.getActiveMarketplaceAds = function (params?: {
    page?: string;
    position?: string;
    country?: string;
  }) {
    return this.get('/marketplace/ads', { params });
  };
  api.startMarketplaceModuleTrial = function (moduleId: string) {
    return this.post(`/developer/marketplace/modules/${moduleId}/trial`);
  };
  api.purchaseMarketplaceModule = function (
    moduleId: string,
    data: { provider: string; phone: string }
  ) {
    return this.post(`/developer/marketplace/modules/${moduleId}/purchase`, data);
  };
  api.getBusinessInstalledModules = function () {
    return this.get('/business/modules/installed');
  };
  api.confirmModuleUpdate = function (installationId: string) {
    return this.post(`/business/modules/update/${installationId}`);
  };
  api.confirmMarketplaceModulePayment = function (data: { providerRef: string }) {
    return this.post('/developer/marketplace/confirm-payment', data);
  };
  api.installMarketplaceModule = function (moduleId: string, data?: any) {
    return this.post(`/developer/marketplace/modules/${moduleId}/install`, data);
  };
  api.getModuleAssignments = function () {
    return this.get('/business/modules/assignments');
  };
  api.getModuleAnalysis = function () {
    return this.get('/business/modules/analysis');
  };
  api.toggleBusinessModule = function (module: string, enabled: boolean) {
    return this.patch('/business/modules/toggle', { module, enabled });
  };
}
