import type { ApiClientMethods } from './api-client.types';

export function injectPartners(api: ApiClientMethods) {
  api.getPartners = function (params?: any) {
    return this.get('/business/partners', { params });
  };
  api.getPartner = function (id: string) {
    return this.get(`/business/partners/${id}`);
  };
  api.createPartner = function (data: any) {
    return this.post('/business/partners', data);
  };
  api.updatePartner = function (id: string, data: any) {
    return this.put(`/business/partners/${id}`, data);
  };
  api.deletePartner = function (id: string) {
    return this.delete(`/business/partners/${id}`);
  };
  api.getPartnerStats = function () {
    return this.get('/business/partners/stats');
  };
  api.getPartnerAnalytics = function () {
    return this.get('/business/partners/analytics');
  };
  api.getPublicPartners = function (slug: string) {
    return this.get(`/business/partners/public/${slug}`);
  };
  api.getPartnerContracts = function (params?: any) {
    return this.get('/business/partners/contracts/list', { params });
  };
  api.createPartnerContract = function (data: any) {
    return this.post('/business/partners/contracts', data);
  };
  api.updatePartnerContract = function (id: string, data: any) {
    return this.put(`/business/partners/contracts/${id}`, data);
  };
  api.signPartnerContract = function (id: string, byBusiness: boolean) {
    return this.post(`/business/partners/contracts/${id}/sign`, { byBusiness });
  };
  api.getPartnerTransactions = function (params?: any) {
    return this.get('/business/partners/transactions/list', { params });
  };
  api.createPartnerTransaction = function (data: any) {
    return this.post('/business/partners/transactions', data);
  };
  api.getPartnerAssignments = function (params?: any) {
    return this.get('/business/partners/assignments/list', { params });
  };
  api.createPartnerAssignment = function (data: any) {
    return this.post('/business/partners/assignments', data);
  };
  api.updatePartnerAssignment = function (id: string, data: any) {
    return this.put(`/business/partners/assignments/${id}`, data);
  };
  api.getPartnerReviews = function (params?: any) {
    return this.get('/business/partners/reviews/list', { params });
  };
  api.createPartnerReview = function (data: any) {
    return this.post('/business/partners/reviews', data);
  };
  api.getPartnerDocuments = function (params?: any) {
    return this.get('/business/partners/documents/list', { params });
  };
  api.createPartnerDocument = function (data: any) {
    return this.post('/business/partners/documents', data);
  };
  api.deletePartnerDocument = function (id: string) {
    return this.delete(`/business/partners/documents/${id}`);
  };
  api.getPartnerPermissions = function (params?: any) {
    return this.get('/business/partners/permissions/list', { params });
  };
  api.createPartnerPermission = function (data: any) {
    return this.post('/business/partners/permissions', data);
  };
  api.updatePartnerPermission = function (id: string, data: any) {
    return this.put(`/business/partners/permissions/${id}`, data);
  };
  api.deletePartnerPermission = function (id: string) {
    return this.delete(`/business/partners/permissions/${id}`);
  };
}
