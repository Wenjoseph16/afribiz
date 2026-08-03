import type { ApiClientMethods } from './api-client.types';

/**
 * Endpoints AnalyticsEvent (chantier 1 — backend /api/analytics/events/*).
 * Consommés par la page dashboard/analytics/realtime.
 */
export function injectAnalyticsEvents(api: ApiClientMethods) {
  api.getAnalyticsEvents = function (params?: any) {
    return this.get('/analytics/events', { params });
  };
  api.getAnalyticsEventsBreakdownType = function (params?: any) {
    return this.get('/analytics/events/breakdown/type', { params });
  };
  api.getAnalyticsEventsBreakdownCategory = function (params?: any) {
    return this.get('/analytics/events/breakdown/category', { params });
  };
  api.getAnalyticsEventsSummary = function (params?: any) {
    return this.get('/analytics/events/summary', { params });
  };
  api.getAnalyticsEventsCounters = function (params?: any) {
    return this.get('/analytics/events/counters', { params });
  };
}
