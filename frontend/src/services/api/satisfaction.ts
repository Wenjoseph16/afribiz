import type { ApiClientMethods } from './api-client.types';

export function injectSatisfaction(api: ApiClientMethods) {
  api.submitSatisfaction = function (data: any) {
    return this.post('/satisfaction', data);
  };
  api.getSatisfactionContext = function (params: any) {
    return this.get('/satisfaction/context', { params });
  };
  api.getBusinessSatisfactionStats = function () {
    return this.get('/satisfaction/stats');
  };
  api.getBusinessReputation = function () {
    return this.get('/satisfaction/reputation');
  };
}
