import type { ApiClientMethods } from './api-client.types';

export function injectSettings(api: ApiClientMethods) {
  api.getBusinessPaymentMethods = function () {
    return this.get('/business/payment-methods');
  };
  api.addBusinessPaymentMethod = function (data: any) {
    return this.post('/business/payment-methods', data);
  };
  api.updateBusinessPaymentMethod = function (id: string, data: any) {
    return this.put(`/business/payment-methods/${id}`, data);
  };
  api.deleteBusinessPaymentMethod = function (id: string) {
    return this.delete(`/business/payment-methods/${id}`);
  };
}
