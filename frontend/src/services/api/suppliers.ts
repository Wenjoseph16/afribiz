import type { ApiClientMethods } from './api-client.types';

export function injectSuppliers(api: ApiClientMethods) {
  api.getSuppliers = function (params?: any) {
    return this.get('/business/suppliers', { params });
  };
  api.createSupplier = function (data: any) {
    return this.post('/business/suppliers', data);
  };
  api.updateSupplier = function (id: string, data: any) {
    return this.patch(`/business/suppliers/${id}`, data);
  };
  api.deleteSupplier = function (id: string) {
    return this.delete(`/business/suppliers/${id}`);
  };
}
