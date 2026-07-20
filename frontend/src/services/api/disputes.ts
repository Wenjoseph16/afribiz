import type { ApiClientMethods } from './api-client.types';

export function injectDisputes(api: ApiClientMethods) {
  api.getDisputes = function (params?: any) {
    return this.get('/business/disputes', { params });
  };
  api.getDisputeDetail = function (id: string) {
    return this.get('/business/disputes/' + id);
  };
  api.createDispute = function (data: any) {
    return this.post('/business/disputes', data);
  };
  api.updateDisputeStatus = function (id: string, status: string) {
    return this.put('/business/disputes/' + id, { status });
  };
}
