import type { ApiClientMethods } from './api-client.types';

export function injectSubscriptions(api: ApiClientMethods) {
  api.getSubscriptionPlans = function () {
    return this.get('/business/subscriptions/plans');
  };
  api.getSubscriptionPlan = function (id: string) {
    return this.get(`/business/subscriptions/plans/${id}`);
  };
  api.createSubscriptionPlan = function (data: any) {
    return this.post('/business/subscriptions/plans', data);
  };
  api.updateSubscriptionPlan = function (id: string, data: any) {
    return this.patch(`/business/subscriptions/plans/${id}`, data);
  };
  api.deleteSubscriptionPlan = function (id: string) {
    return this.delete(`/business/subscriptions/plans/${id}`);
  };
  api.getSubscribers = function (params?: any) {
    return this.get('/business/subscriptions/subscribers', { params });
  };
  api.getSubscriber = function (id: string) {
    return this.get(`/business/subscriptions/subscribers/${id}`);
  };
  api.createSubscription = function (data: any) {
    return this.post('/business/subscriptions/subscribers', data);
  };
  api.cancelSubscription = function (id: string) {
    return this.patch(`/business/subscriptions/subscribers/${id}/cancel`);
  };
  api.renewSubscription = function (id: string) {
    return this.post(`/business/subscriptions/subscribers/${id}/renew`);
  };
  api.getSubscriptionPayments = function (params?: any) {
    return this.get('/business/subscriptions/payments', { params });
  };
  api.recordSubscriptionPayment = function (data: any) {
    return this.post('/business/subscriptions/payments', data);
  };
  api.getSubscriptionStats = function () {
    return this.get('/business/subscriptions/stats');
  };
  api.getSubscriptionLogs = function (params?: any) {
    return this.get('/business/subscriptions/logs', { params });
  };
}
