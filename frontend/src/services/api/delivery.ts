import type { ApiClientMethods } from './api-client.types';

export function injectDelivery(api: ApiClientMethods) {
  api.getDeliveries = function (params?: any) {
    return this.get('/business/delivery', { params });
  };
  api.getDelivery = function (id: string) {
    return this.get(`/business/delivery/${id}`);
  };
  api.createDelivery = function (data: any) {
    return this.post('/business/delivery', data);
  };
  api.updateDelivery = function (id: string, data: any) {
    return this.patch(`/business/delivery/${id}`, data);
  };
  api.assignDriver = function (id: string, data: any) {
    return this.post(`/business/delivery/${id}/assign`, data);
  };
  api.updateDeliveryStatus = function (id: string, status: string) {
    return this.patch(`/business/delivery/${id}/status`, { status });
  };
  api.addTrackingEvent = function (id: string, data: any) {
    return this.post(`/business/delivery/${id}/tracking`, data);
  };
  api.addDeliveryProof = function (id: string, data: any) {
    return this.post(`/business/delivery/${id}/proofs`, data);
  };
  api.getDeliveryZones = function () {
    return this.get('/business/delivery/zones');
  };
  api.createDeliveryZone = function (data: any) {
    return this.post('/business/delivery/zones', data);
  };
  api.updateDeliveryZone = function (id: string, data: any) {
    return this.patch(`/business/delivery/zones/${id}`, data);
  };
  api.deleteDeliveryZone = function (id: string) {
    return this.delete(`/business/delivery/zones/${id}`);
  };
  api.getDrivers = function (params?: any) {
    return this.get('/business/delivery/drivers', { params });
  };
  api.createDriver = function (data: any) {
    return this.post('/business/delivery/drivers', data);
  };
  api.updateDriver = function (id: string, data: any) {
    return this.patch(`/business/delivery/drivers/${id}`, data);
  };
  api.deleteDriver = function (id: string) {
    return this.delete(`/business/delivery/drivers/${id}`);
  };
  api.getDeliveryStats = function () {
    return this.get('/business/delivery/stats');
  };
}
