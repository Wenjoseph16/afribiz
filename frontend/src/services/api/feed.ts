import type { ApiClientMethods } from './api-client.types';

export function injectFeed(api: ApiClientMethods) {
  api.getFeedItems = function (params?: any) {
    return this.get('/feed', { params });
  };
  api.createFeedItem = function (data: any) {
    return this.post('/feed', data);
  };
  api.deleteFeedItem = function (id: string) {
    return this.delete('/feed/' + id);
  };
}
