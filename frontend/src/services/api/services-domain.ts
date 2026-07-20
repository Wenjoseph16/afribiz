import type { ApiClientMethods } from './api-client.types';

export function injectServicesDomain(api: ApiClientMethods) {
  api.getMyServices = function (params?: any) {
    return this.get('/business/services', { params });
  };
  api.getMyService = function (id: string) {
    return this.get(`/business/services/${id}`);
  };
  api.createService = function (data: any) {
    return this.post('/business/services', data);
  };
  api.updateService = function (id: string, data: any) {
    return this.put(`/business/services/${id}`, data);
  };
  api.deleteService = function (id: string) {
    return this.delete(`/business/services/${id}`);
  };
  api.toggleServiceActive = function (id: string) {
    return this.patch(`/business/services/${id}/toggle`);
  };
  api.getServiceCategories = function () {
    return this.get('/business/services/categories');
  };
  api.createServiceCategory = function (data: any) {
    return this.post('/business/services/categories', data);
  };
  api.updateServiceCategory = function (id: string, data: any) {
    return this.put(`/business/services/categories/${id}`, data);
  };
  api.deleteServiceCategory = function (id: string) {
    return this.delete(`/business/services/categories/${id}`);
  };
  api.getServiceStats = function () {
    return this.get('/business/services/stats');
  };
  api.duplicateService = function (id: string) {
    return this.post(`/business/services/${id}/duplicate`);
  };
  api.exportServices = function (params?: any) {
    return this.get('/business/services/export', { params });
  };
  api.importServices = function (data: any) {
    return this.post('/business/services/import', data);
  };
  api.bulkDeleteServices = function (ids: string[]) {
    return this.post('/business/services/bulk/delete', { ids });
  };
  api.bulkToggleServices = function (ids: string[], isActive: boolean) {
    return this.patch('/business/services/bulk/toggle', { ids, isActive });
  };
}
