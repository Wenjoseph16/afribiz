import type { ApiClientMethods } from './api-client.types';

export function injectCrmAutomation(api: ApiClientMethods) {
  api.getAutomationRules = function () {
    return this.get('/business/crm/automation');
  };
  api.getAutomationRule = function (id: string) {
    return this.get(`/business/crm/automation/${id}`);
  };
  api.createAutomationRule = function (data: any) {
    return this.post('/business/crm/automation', data);
  };
  api.updateAutomationRule = function (id: string, data: any) {
    return this.put(`/business/crm/automation/${id}`, data);
  };
  api.toggleAutomationRule = function (id: string) {
    return this.patch(`/business/crm/automation/${id}/toggle`);
  };
  api.deleteAutomationRule = function (id: string) {
    return this.delete(`/business/crm/automation/${id}`);
  };
}
