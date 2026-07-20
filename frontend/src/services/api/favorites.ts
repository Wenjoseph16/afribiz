import type { ApiClientMethods } from './api-client.types';

export function injectFavorites(api: ApiClientMethods) {
  api.getFavorites = function (params?: any) {
    return this.get('/favorites', { params });
  };
  api.addFavorite = function (type: string, referenceId: string) {
    return this.post('/favorites', { type, referenceId });
  };
  api.removeFavorite = function (id: string) {
    return this.delete(`/favorites/${id}`);
  };
}
