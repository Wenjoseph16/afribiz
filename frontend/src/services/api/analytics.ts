import type { ApiClientMethods } from './api-client.types';

export function injectAnalytics(api: ApiClientMethods) {
  api.getBusinessFunnel = function () {
    return this.get('/business/analytics/funnel');
  };
  api.getBusinessEngagement = function () {
    return this.get('/business/analytics/engagement');
  };
}
