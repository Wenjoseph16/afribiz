import type { ApiClientMethods } from './api-client.types';

export function injectClientData(api: ApiClientMethods) {
  api.getMyLoyalty = function () {
    return this.get('/promotions/loyalty/program');
  };
  api.redeemLoyaltyPoints = function (data: {
    businessId: string;
    points: number;
    rewardTitle?: string;
    rewardType?: string;
  }) {
    return this.post('/loyalty/redeem', data);
  };
  api.getAvailablePromotions = function () {
    return this.get('/promotions');
  };
  api.getMyTrainings = function () {
    return this.get('/trainings/my');
  };
  api.enrollInTraining = function (id: string) {
    return this.post(`/trainings/${id}/enroll`);
  };
  api.registerForEvent = function (id: string) {
    return this.post(`/events/${id}/register`);
  };
  api.getClientDashboardStats = function () {
    return this.get('/dashboard/client/stats');
  };
}
