import type { ApiClientMethods } from './api-client.types';

export function injectDocuments(api: ApiClientMethods) {
  api.getDocuments = function (params?: any) {
    return this.get('/business/documents', { params });
  };
  api.getDocument = function (id: string) {
    return this.get(`/business/documents/${id}`);
  };
  api.createDocument = function (data: any) {
    return this.post('/business/documents', data);
  };
  api.updateDocument = function (id: string, data: any) {
    return this.patch(`/business/documents/${id}`, data);
  };
  api.deleteDocument = function (id: string) {
    return this.delete(`/business/documents/${id}`);
  };
  api.getDocumentStats = function () {
    return this.get('/business/documents/stats');
  };
}
