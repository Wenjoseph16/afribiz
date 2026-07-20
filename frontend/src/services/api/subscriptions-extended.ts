import type { ApiClientMethods } from './api-client.types';

export function injectSubscriptionsExtended(api: ApiClientMethods) {
  api.adminGetAllSubscriptionPlans = function () {
    return this.get('/admin/subscription-plans');
  };
  api.adminCreateSubscriptionPlan = function (data: any) {
    return this.post('/admin/subscription-plans', data);
  };
  api.adminUpdateSubscriptionPlan = function (id: string, data: any) {
    return this.put('/admin/subscription-plans/' + id, data);
  };
  api.adminDeleteSubscriptionPlan = function (id: string) {
    return this.delete('/admin/subscription-plans/' + id);
  };
  api.adminAddPlanPrivilege = function (planId: string, data: any) {
    return this.post('/admin/subscription-plans/' + planId + '/privileges', data);
  };
  api.adminUpdatePlanPrivilege = function (planId: string, id: string, data: any) {
    return this.put('/admin/subscription-plans/' + planId + '/privileges/' + id, data);
  };
  api.adminDeletePlanPrivilege = function (planId: string, id: string) {
    return this.delete('/admin/subscription-plans/' + planId + '/privileges/' + id);
  };
  api.adminGetAllSubscriptions = function (params?: any) {
    return this.get('/admin/subscriptions', { params });
  };
  api.adminGetSubscriptionStats = function () {
    return this.get('/admin/subscriptions/stats');
  };
  api.adminCancelSubscription = function (id: string) {
    return this.post('/admin/subscriptions/' + id + '/cancel');
  };
  api.adminRenewSubscription = function (id: string) {
    return this.post('/admin/subscriptions/' + id + '/renew');
  };
  api.getMySubscription = function () {
    return this.get('/subscriptions/my-subscription');
  };
  api.subscribeToPlan = function (planId: string) {
    return this.post('/subscriptions/subscribe', { planId });
  };
  api.cancelMySubscription = function () {
    return this.post('/subscriptions/my-subscription/cancel');
  };
}
