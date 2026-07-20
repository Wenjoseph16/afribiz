import type { ApiClientMethods } from './api-client.types';

export function injectDataHub(api: ApiClientMethods) {
  api.getPartnerReports = function (params?: any) {
    return this.get('/data-hub/reports', { params });
  };
  api.getPartnerReportDetail = function (id: string) {
    return this.get(`/data-hub/reports/${id}`);
  };
  api.orderPartnerReport = function (data: any) {
    return this.post('/data-hub/reports/order', data);
  };
  api.getPartnerBusinessDetails = function (businessId: string) {
    return this.get(`/data-hub/businesses/${businessId}`);
  };
  api.getHubPlatformStats = function (params?: any) {
    return this.get('/datahub/stats', { params });
  };
  api.getHubSectorBenchmarks = function (params?: any) {
    return this.get('/datahub/sectors', { params });
  };
  api.getHubSectorStats = function (params?: any) {
    return this.get('/datahub/sectors', { params });
  };
  api.getHubGeographicStats = function (params?: any) {
    return this.get('/datahub/geographic', { params });
  };
  api.getHubGrowthStats = function (params?: any) {
    return this.get('/datahub/growth', { params });
  };
  api.getHubPaymentTrends = function (params?: any) {
    return this.get('/datahub/payments', { params });
  };
}
