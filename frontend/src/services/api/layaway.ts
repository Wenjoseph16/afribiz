import type { ApiClientMethods } from './api-client.types';

export function injectLayaway(api: ApiClientMethods) {
  // ── Business : offres d'épargne ──
  api.createLayawayOffer = function (data: any) {
    return this.post('/layaway/offers', data);
  };
  api.createLayawayOffersBatch = function (data: any) {
    return this.post('/layaway/offers/batch', data);
  };
  api.getLayawayOffers = function () {
    return this.get('/layaway/offers');
  };
  api.toggleLayawayOffer = function (id: string, isActive: boolean) {
    return this.patch(`/layaway/offers/${id}`, { isActive });
  };
  api.deleteLayawayOffer = function (id: string) {
    return this.delete(`/layaway/offers/${id}`);
  };
  api.getBusinessLayawayPlans = function () {
    return this.get('/layaway/business/plans');
  };
  api.getBusinessLayawayStats = function () {
    return this.get('/layaway/business/stats');
  };

  // ── Client / public ──
  api.getActiveLayawayOffer = function (itemType: string, itemId: string) {
    return this.get('/layaway/offers/active', { params: { itemType, itemId } });
  };
  api.getActiveLayawayOffers = function (itemType: string, itemIds: string[]) {
    return this.get('/layaway/offers/batch', { params: { itemType, itemIds: itemIds.join(',') } });
  };
  api.createLayawayPlan = function (offerId: string) {
    return this.post('/layaway/plans', { offerId });
  };
  api.getMyLayawayPlans = function () {
    return this.get('/layaway/my-plans');
  };
  api.getLayawayPlan = function (id: string) {
    return this.get(`/layaway/plans/${id}`);
  };
  api.contributeLayaway = function (id: string, data: any) {
    return this.post(`/layaway/plans/${id}/contribute`, data);
  };
  api.cancelLayawayPlan = function (id: string) {
    return this.post(`/layaway/plans/${id}/cancel`);
  };
  api.confirmLayawayCheckout = function (id: string, data?: any) {
    return this.post(`/layaway/plans/${id}/confirm`, data);
  };
}
