import type { ApiClientMethods } from './api-client.types';

export function injectPromotions(api: ApiClientMethods) {
  api.getMyPromotions = function (params?: any) {
    return this.get('/business/promotions', { params });
  };
  api.getMyPromotion = function (id: string) {
    return this.get(`/business/promotions/${id}`);
  };
  api.createPromotion = function (data: any) {
    return this.post('/business/promotions', data);
  };
  api.updatePromotion = function (id: string, data: any) {
    return this.patch(`/business/promotions/${id}`, data);
  };
  api.deletePromotion = function (id: string) {
    return this.delete(`/business/promotions/${id}`);
  };
  api.getPromoCoupons = function (params?: any) {
    return this.get('/business/promotions/coupons', { params });
  };
  api.createPromoCoupon = function (data: any) {
    return this.post('/business/promotions/coupons', data);
  };
  api.getPromoBundles = function (params?: any) {
    return this.get('/business/promotions/bundles', { params });
  };
  api.createPromoBundle = function (data: any) {
    return this.post('/business/promotions/bundles', data);
  };
  api.getPromoCampaigns = function (params?: any) {
    return this.get('/business/promotions/campaigns', { params });
  };
  api.createPromoCampaign = function (data: any) {
    return this.post('/business/promotions/campaigns', data);
  };
  api.getLoyaltyProgram = function () {
    return this.get('/business/promotions/loyalty/program');
  };
  api.updateLoyaltyProgram = function (data: any) {
    return this.put('/business/promotions/loyalty/program', data);
  };
  api.getPromoStats = function () {
    return this.get('/business/promotions/stats');
  };
}
