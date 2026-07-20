import type { ApiClientMethods } from './api-client.types';

export function injectAutomations(api: ApiClientMethods) {
  api.getAutomationStatus = function () {
    return this.get('/automations/status');
  };
  api.getAutomationActivity = function () {
    return this.get('/automations/activity');
  };
  api.getExecutionLogs = function (limit?: number) {
    return this.get('/automations/execution-logs?limit=' + (limit || 50));
  };
  api.getFailedJobs = function () {
    return this.get('/automations/failed-jobs');
  };
  api.getErrorRate = function () {
    return this.get('/automations/error-rate');
  };
}
