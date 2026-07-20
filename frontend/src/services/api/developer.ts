import type { ApiClientMethods } from './api-client.types';

export function injectDeveloper(api: ApiClientMethods) {
  api.getDeveloperProfile = function () {
    return this.get('/developer/profile');
  };
  api.updateDeveloperProfile = function (data: any) {
    return this.put('/developer/profile', data);
  };
  api.getDeveloperDashboard = function () {
    return this.get('/developer/dashboard');
  };
  api.getDeveloperModules = function (params?: any) {
    return this.get('/developer/modules', { params });
  };
  api.getDeveloperModule = function (id: string) {
    return this.get(`/developer/modules/${id}`);
  };
  api.createDeveloperModule = function (data: any) {
    return this.post('/developer/modules', data);
  };
  api.updateDeveloperModule = function (id: string, data: any) {
    return this.put(`/developer/modules/${id}`, data);
  };
  api.publishDeveloperModule = function (id: string) {
    return this.post(`/developer/modules/${id}/publish`);
  };
  api.createModuleVersion = function (moduleId: string, data: any) {
    return this.post(`/developer/modules/${moduleId}/versions`, data);
  };
  api.uploadModuleVersionFile = function (moduleId: string, versionId: string, formData: FormData) {
    return this.post(`/developer/modules/${moduleId}/versions/${versionId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };
  api.getModuleVersions = function (moduleId: string) {
    return this.get(`/developer/modules/${moduleId}/versions`);
  };
  api.getModuleReviews = function (moduleId: string) {
    return this.get(`/developer/modules/${moduleId}/reviews`);
  };
  api.createModuleReview = function (moduleId: string, data: any) {
    return this.post(`/developer/modules/${moduleId}/reviews`, data);
  };
  api.getDeveloperOrders = function (params?: any) {
    return this.get('/developer/orders', { params });
  };
  api.getDeveloperRevenues = function () {
    return this.get('/developer/revenues');
  };
  api.getDeveloperRevenueSummary = function () {
    return this.get('/developer/revenues/summary');
  };
  api.getDeveloperPayouts = function () {
    return this.get('/developer/payouts');
  };
  api.requestDeveloperPayout = function (data: any) {
    return this.post('/developer/payouts', data);
  };
  api.getDeveloperInstallations = function (params?: any) {
    return this.get('/developer/installations', { params });
  };
  api.getDeveloperSubscriptions = function () {
    return this.get('/developer/subscriptions');
  };
  api.getDeveloperTickets = function () {
    return this.get('/developer/tickets');
  };
  api.getDeveloperTicket = function (id: string) {
    return this.get(`/developer/tickets/${id}`);
  };
  api.createDeveloperTicket = function (data: any) {
    return this.post('/developer/tickets', data);
  };
  api.replyToTicket = function (ticketId: string, data: any) {
    return this.post(`/developer/tickets/${ticketId}/messages`, data);
  };
  api.updateTicketStatus = function (ticketId: string, status: string) {
    return this.put(`/developer/tickets/${ticketId}/status`, { status });
  };
  api.uploadModuleImage = function (moduleId: string, formData: FormData) {
    return this.post(`/developer/modules/${moduleId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };
  api.submitDeveloperVerification = function (documents: any) {
    return this.post('/developer/verification', documents);
  };
  api.createSupportTicket = function (data: any) {
    return this.post('/messages/support', data);
  };
  api.installCoreModule = function (moduleId: string) {
    return this.post(`/developer/marketplace/modules/${moduleId}/install`);
  };
  api.uninstallCoreModule = function (moduleId: string) {
    return this.post(`/developer/marketplace/modules/${moduleId}/uninstall`);
  };
  api.reinstallModule = function (moduleId: string) {
    return this.post(`/developer/marketplace/modules/${moduleId}/reinstall`);
  };
}
