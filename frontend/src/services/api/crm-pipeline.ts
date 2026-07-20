import type { ApiClientMethods } from './api-client.types';

export function injectCrmPipeline(api: ApiClientMethods) {
  api.getPipelineStages = function () {
    return this.get('/business/crm/pipeline/stages');
  };
  api.createPipelineStage = function (data: any) {
    return this.post('/business/crm/pipeline/stages', data);
  };
  api.updatePipelineStage = function (id: string, data: any) {
    return this.put(`/business/crm/pipeline/stages/${id}`, data);
  };
  api.deletePipelineStage = function (id: string) {
    return this.delete(`/business/crm/pipeline/stages/${id}`);
  };
  api.getPipelineDeals = function (params?: any) {
    return this.get('/business/crm/pipeline/deals', { params });
  };
  api.getPipelineDeal = function (id: string) {
    return this.get(`/business/crm/pipeline/deals/${id}`);
  };
  api.createPipelineDeal = function (data: any) {
    return this.post('/business/crm/pipeline/deals', data);
  };
  api.updatePipelineDeal = function (id: string, data: any) {
    return this.put(`/business/crm/pipeline/deals/${id}`, data);
  };
  api.movePipelineDeal = function (id: string, data: any) {
    return this.patch(`/business/crm/pipeline/deals/${id}/move`, data);
  };
  api.deletePipelineDeal = function (id: string) {
    return this.delete(`/business/crm/pipeline/deals/${id}`);
  };
  api.getPipelineStats = function () {
    return this.get('/business/crm/pipeline/stats');
  };
  api.seedPipelineStages = function () {
    return this.post('/business/crm/pipeline/seed');
  };
}
