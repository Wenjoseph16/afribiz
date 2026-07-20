import type { ApiClientMethods } from './api-client.types';

export function injectCrm(api: ApiClientMethods) {
  api.getCrmDashboardStats = function () {
    return this.get('/business/crm/dashboard');
  };
  api.getCrmClients = function (params?: any) {
    return this.get('/business/crm/clients', { params });
  };
  api.getCrmClientDetail = function (clientId: string) {
    return this.get(`/business/crm/clients/${clientId}`);
  };
  api.getCustomer360 = function (clientId: string) {
    return this.get(`/business/crm/clients/${clientId}/360`);
  };
  api.trackPageView = function (data: {
    userId?: string;
    visitorId?: string;
    referrer?: string;
    duration?: number;
  }) {
    return this.post('/business/crm/track/page-view', data);
  };
  api.trackProductView = function (data: {
    productId: string;
    userId?: string;
    visitorId?: string;
    referrer?: string;
    source?: string;
  }) {
    return this.post('/business/crm/track/product-view', data);
  };
  api.trackProductClick = function (data: {
    productId: string;
    userId?: string;
    visitorId?: string;
    source?: string;
  }) {
    return this.post('/business/crm/track/product-click', data);
  };
  api.createCrmClientNote = function (clientId: string, content: string) {
    return this.post(`/business/crm/clients/${clientId}/notes`, { content });
  };
  api.updateCrmClientNote = function (noteId: string, content: string) {
    return this.put(`/business/crm/clients/notes/${noteId}`, { content });
  };
  api.deleteCrmClientNote = function (noteId: string) {
    return this.delete(`/business/crm/clients/notes/${noteId}`);
  };
  api.getCrmTags = function () {
    return this.get('/business/crm/tags');
  };
  api.createCrmTag = function (name: string, color?: string) {
    return this.post('/business/crm/tags', { name, color });
  };
  api.deleteCrmTag = function (tagId: string) {
    return this.delete(`/business/crm/tags/${tagId}`);
  };
  api.assignCrmTag = function (clientId: string, tagId: string) {
    return this.post(`/business/crm/clients/${clientId}/tags`, { tagId });
  };
  api.removeCrmTag = function (clientId: string, tagId: string) {
    return this.delete(`/business/crm/clients/${clientId}/tags/${tagId}`);
  };
  api.getCrmSegments = function () {
    return this.get('/business/crm/segments');
  };
  api.createCrmSegment = function (data: {
    name: string;
    description?: string;
    color?: string;
    conditions?: any;
    isDynamic?: boolean;
  }) {
    return this.post('/business/crm/segments', data);
  };
  api.updateCrmSegment = function (segmentId: string, data: any) {
    return this.put(`/business/crm/segments/${segmentId}`, data);
  };
  api.deleteCrmSegment = function (segmentId: string) {
    return this.delete(`/business/crm/segments/${segmentId}`);
  };
  api.recalculateCrmSegment = function (segmentId: string) {
    return this.post(`/business/crm/segments/${segmentId}/recalculate`);
  };
  api.assignClientToSegment = function (clientId: string, segmentId: string) {
    return this.post(`/business/crm/clients/${clientId}/segments`, { segmentId });
  };
  api.removeClientFromSegment = function (clientId: string, segmentId: string) {
    return this.delete(`/business/crm/clients/${clientId}/segments/${segmentId}`);
  };
}
