import type { ApiClientMethods } from './api-client.types';

export function injectAds(api: ApiClientMethods) {
  api.getMyAdCampaigns = function () {
    return this.get('/ads/my-campaigns');
  };
  api.createAdCampaign = function (data: any) {
    return this.post('/ads/campaigns', data);
  };
  api.getAdCampaignById = function (id: string) {
    return this.get(`/ads/campaigns/${id}`);
  };
  api.getAdCampaignStats = function (id: string) {
    return this.get(`/ads/campaigns/${id}/stats`);
  };
  api.getActiveAds = function (params?: any) {
    return this.get('/ads/active', { params });
  };
  api.pauseAdCampaign = function (id: string) {
    return this.patch(`/ads/${id}/pause`);
  };
  api.resumeAdCampaign = function (id: string) {
    return this.patch(`/ads/${id}/resume`);
  };
  api.deleteAdCampaign = function (id: string) {
    return this.delete(`/ads/${id}`);
  };

  // Extended methods
  api.getAdCampaign = function (campaignId: string) {
    return this.get(`/ads/${campaignId}`);
  };
  api.generateAdInvoice = function (campaignId: string) {
    return this.post(`/ads/${campaignId}/invoice`);
  };
  api.reportAd = function (data: any) {
    return this.post('/ads/report', data);
  };
  api.trackAdImpression = function (data: any) {
    return this.post('/ads/track/impression', data);
  };
  api.trackAdClick = function (data: any) {
    return this.post('/ads/track/click', data);
  };
}
