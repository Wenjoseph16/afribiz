import type { ApiClientMethods } from './api-client.types';

export function injectAgents(api: ApiClientMethods) {
  api.getAgents = function (params?: any) {
    return this.get('/business/agents', { params });
  };
  api.getAgent = function (id: string) {
    return this.get('/business/agents/' + id);
  };
  api.createAgent = function (data: any) {
    return this.post('/business/agents', data);
  };
  api.updateAgent = function (id: string, data: any) {
    return this.put('/business/agents/' + id, data);
  };
  api.deleteAgent = function (id: string) {
    return this.delete('/business/agents/' + id);
  };
  api.getAgentStats = function () {
    return this.get('/business/agents/stats');
  };
  api.recordAgentTransaction = function (data: any) {
    return this.post('/business/agents/transactions', data);
  };
  api.getAgentTransactions = function (params?: any) {
    return this.get('/business/agents/transactions', { params });
  };
}
