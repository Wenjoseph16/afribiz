import type { ApiClientMethods } from './api-client.types';

export function injectOfflineSync(api: ApiClientMethods) {
  api.getSyncItems = function (params?: any) {
    return this.get('/sync/items', { params });
  };
  api.createSyncItem = function (data: any) {
    return this.post('/sync/items', data);
  };
  api.processSyncItem = function (id: string) {
    return this.post('/sync/items/' + id + '/process');
  };
  api.getPendingSyncCount = function () {
    return this.get('/sync/pending-count');
  };
  api.bulkSync = function (items: any[]) {
    return this.post('/sync/bulk', { items });
  };
}
