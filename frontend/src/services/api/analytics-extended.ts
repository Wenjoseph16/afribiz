import type { ApiClientMethods } from './api-client.types';

export function injectAnalyticsExtended(api: ApiClientMethods) {
  api.getSearchTrends = function (params?: any) {
    return this.get('/analytics/search-trends', { params });
  };
  api.getConversionFunnel = function () {
    return this.get('/analytics/conversion-funnel');
  };
  api.getRetentionCohorts = function () {
    return this.get('/analytics/retention-cohorts');
  };
  api.getProductRecommendations = function (params?: any) {
    return this.get('/analytics/product-recommendations', { params });
  };
  api.getEngagementAnalytics = function () {
    return this.get('/analytics/engagement');
  };
}

export function injectCopilot(api: ApiClientMethods) {
  api.getDailyTips = function () {
    return this.get('/copilot/daily-tips');
  };
  api.getBusinessHealth = function () {
    return this.get('/copilot/business-health');
  };
  api.getModuleTips = function (moduleKey: string) {
    return this.get(`/copilot/module/${moduleKey}/tips`);
  };
  api.generateLLMAnalysis = function () {
    return this.post('/copilot/analyze');
  };
  api.generateProductDescription = function (data: {
    productName: string;
    category: string;
    price: number;
    currency?: string;
    keywords?: string[];
  }) {
    return this.post('/copilot/generate-description', data);
  };
  api.generateSmartTip = function (moduleKey: string) {
    return this.post('/copilot/smart-tip', { moduleKey });
  };
  api.getDailyBrief = function () {
    return this.get('/copilot/daily-brief');
  };
  api.getBenchmarks = function () {
    return this.get('/copilot/benchmarks');
  };
  api.getAnomalies = function () {
    return this.get('/copilot/anomalies');
  };
  api.getSeasonal = function () {
    return this.get('/copilot/seasonal');
  };
  api.getWeeklyReport = function () {
    return this.get('/copilot/weekly-report');
  };
  api.triggerOnboarding = function () {
    return this.post('/copilot/onboarding/trigger');
  };
}
