import type { ApiClientMethods } from './api-client.types';

export function injectSatisfaction(api: ApiClientMethods) {
  api.submitSatisfaction = function (data: any) {
    return this.post('/satisfaction', data);
  };
  api.getSatisfactionContext = function (params: any) {
    return this.get('/satisfaction/context', { params });
  };
}
