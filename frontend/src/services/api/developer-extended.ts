import type { ApiClientMethods } from './api-client.types';

export function injectDeveloperExtended(api: ApiClientMethods) {
  api.getModulePermissions = function (moduleId: string) {
    return this.get(`/developer/modules/${moduleId}/permissions`);
  };
  api.addModulePermission = function (
    moduleId: string,
    data: { resource: string; accessLevel: string; description?: string; isRequired?: boolean }
  ) {
    return this.post(`/developer/modules/${moduleId}/permissions`, data);
  };
  api.removeModulePermission = function (permissionId: string) {
    return this.delete(`/developer/permissions/${permissionId}`);
  };
  api.checkModulePermissions = function (moduleId: string, businessId: string) {
    return this.get(`/developer/modules/${moduleId}/permissions/check`, { params: { businessId } });
  };
  api.getPermissionSummary = function (moduleId: string) {
    return this.get(`/developer/modules/${moduleId}/permissions/summary`);
  };
  api.createLicense = function (data: {
    moduleId: string;
    businessId: string;
    licenseType: string;
    price?: number;
    currency?: string;
    expiresAt?: Date;
    autoRenew?: boolean;
  }) {
    return this.post('/developer/licenses', data);
  };
  api.activateLicense = function (licenseKey: string) {
    return this.post('/developer/licenses/activate', { licenseKey });
  };
  api.revokeLicense = function (id: string, reason?: string) {
    return this.post(`/developer/licenses/${id}/revoke`, { reason });
  };
  api.renewLicense = function (id: string, durationDays?: number) {
    return this.post(`/developer/licenses/${id}/renew`, { durationDays });
  };
  api.checkLicense = function (moduleId: string, businessId: string) {
    return this.get(`/developer/licenses/check?moduleId=${moduleId}&businessId=${businessId}`);
  };
  api.getModuleLicenses = function (moduleId: string) {
    return this.get(`/developer/modules/${moduleId}/licenses`);
  };
  api.getBusinessLicenses = function (businessId: string) {
    return this.get(`/developer/licenses/business/${businessId}`);
  };
  api.getLicenseStats = function () {
    return this.get('/developer/licenses/stats');
  };
  api.getApiKeys = function () {
    return this.get('/developer/api-keys');
  };
  api.createApiKey = function (data: { name: string; scopes?: string[]; expiresAt?: Date }) {
    return this.post('/developer/api-keys', data);
  };
  api.revokeApiKey = function (id: string) {
    return this.post(`/developer/api-keys/${id}/revoke`);
  };
  api.getWebhooks = function () {
    return this.get('/developer/webhooks');
  };
  api.createWebhook = function (data: { url: string; events: string[]; moduleId?: string }) {
    return this.post('/developer/webhooks', data);
  };
  api.deleteWebhook = function (id: string) {
    return this.delete(`/developer/webhooks/${id}`);
  };
  api.getWebhookDeliveries = function (webhookId: string, limit?: number) {
    return this.get(`/developer/webhooks/${webhookId}/deliveries`, { params: { limit } });
  };
  api.trackAnalytics = function (moduleId: string, data: any) {
    return this.post(`/developer/modules/${moduleId}/analytics/track`, data);
  };
  api.getModuleAnalytics = function (moduleId: string, startDate?: string, endDate?: string) {
    return this.get(`/developer/modules/${moduleId}/analytics`, { params: { startDate, endDate } });
  };
  api.getDeveloperAnalyticsOverview = function () {
    return this.get('/developer/analytics/overview');
  };
  api.logModuleError = function (moduleId: string, data: any) {
    return this.post(`/developer/modules/${moduleId}/errors`, data);
  };
  api.getModuleErrors = function (moduleId: string, resolved?: boolean, limit?: number) {
    return this.get(`/developer/modules/${moduleId}/errors`, { params: { resolved, limit } });
  };
  api.resolveModuleError = function (errorId: string) {
    return this.post(`/developer/errors/${errorId}/resolve`);
  };
  api.submitModuleForValidation = function (moduleId: string) {
    return this.post(`/developer/modules/${moduleId}/validation/submit`);
  };
  api.getModuleValidation = function (moduleId: string) {
    return this.get(`/developer/modules/${moduleId}/validation`);
  };
  api.getValidationHistory = function (moduleId: string) {
    return this.get(`/developer/modules/${moduleId}/validation/history`);
  };
  api.getPendingValidations = function () {
    return this.get('/developer/validations/pending');
  };
  api.approveValidationCheck = function (checkId: string, score: number, details?: string) {
    return this.post(`/developer/validation-checks/${checkId}/approve`, { score, details });
  };
  api.rejectValidationCheck = function (checkId: string, details: string) {
    return this.post(`/developer/validation-checks/${checkId}/reject`, { details });
  };
  api.completeValidation = function (validationId: string, status: string, notes?: string) {
    return this.post(`/developer/validations/${validationId}/complete`, { status, notes });
  };
  api.saveModuleConfiguration = function (
    moduleId: string,
    data: { businessId: string; installationId: string; settings: any }
  ) {
    return this.post(`/developer/modules/${moduleId}/configuration`, data);
  };
  api.getModuleConfiguration = function (moduleId: string, businessId: string) {
    return this.get(`/developer/modules/${moduleId}/configuration?businessId=${businessId}`);
  };
  api.toggleModuleActive = function (moduleId: string, businessId: string, isActive: boolean) {
    return this.put(`/developer/modules/${moduleId}/configuration/toggle`, {
      isActive,
      businessId,
    });
  };
  api.getModuleConfigurations = function (moduleId: string) {
    return this.get(`/developer/modules/${moduleId}/configurations`);
  };
  api.getBusinessModules = function (businessId: string) {
    return this.get(`/developer/configurations/business/${businessId}`);
  };
  api.logActivity = function (
    moduleId: string,
    data: {
      activityType: string;
      businessId?: string;
      installationId?: string;
      description?: string;
      metadata?: any;
    }
  ) {
    return this.post(`/developer/modules/${moduleId}/activity`, data);
  };
  api.getModuleActivity = function (moduleId: string, limit?: number) {
    return this.get(`/developer/modules/${moduleId}/activity`, { params: { limit } });
  };
  api.getDeveloperActivityFeed = function (limit?: number) {
    return this.get('/developer/activity/feed', { params: { limit } });
  };
  api.getBusinessActivityFeed = function (businessId: string, limit?: number) {
    return this.get(`/developer/activity/business/${businessId}`, { params: { limit } });
  };
  api.getActivityStats = function (moduleId: string) {
    return this.get(`/developer/modules/${moduleId}/activity/stats`);
  };
}
