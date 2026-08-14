import type { ApiClientMethods } from './api-client.types';

export function injectCatalogAttachments(api: ApiClientMethods) {
  /** Résolveur public : badges + prix effectif (moteur) + cible pour une liste d'articles. */
  api.resolveCatalogAttachments = function (items: Array<{ itemType: string; itemId: string; quantity?: number; options?: any }>) {
    return this.post('/catalog/attachments', { items });
  };
  api.getCatalogAttachments = function (params?: any) {
    return this.get('/business/catalog-attachments', { params });
  };
  api.createCatalogAttachment = function (data: any) {
    return this.post('/business/catalog-attachments', data);
  };
  api.updateCatalogAttachment = function (id: string, data: any) {
    return this.patch(`/business/catalog-attachments/${id}`, data);
  };
  api.deleteCatalogAttachment = function (id: string) {
    return this.delete(`/business/catalog-attachments/${id}`);
  };
}
