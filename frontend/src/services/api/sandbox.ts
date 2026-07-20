import type { ApiClientMethods } from './api-client.types';

export function injectSandbox(api: ApiClientMethods) {
  api.getSimulationEnvironments = function () {
    return this.get('/sandbox/environments');
  };
  api.testSimulationEndpoint = function (
    moduleSlug: string,
    data: { endpoint: string; method: string; body?: any }
  ) {
    return this.post(`/sandbox/environments/${moduleSlug}/test`, data);
  };
  api.getSimulationLogs = function (moduleSlug?: string) {
    return this.get('/sandbox/logs', { params: { moduleSlug } });
  };
  api.getSimulationMockData = function (moduleSlug: string, dataType: string) {
    return this.get(`/sandbox/environments/${moduleSlug}/mock/${dataType}`);
  };
  api.getSimulationEndpoints = function () {
    return this.get('/sandbox/endpoints');
  };
  api.getSandboxEnvironments = function () {
    return this.get('/sandbox');
  };
}
