import type { ApiClientMethods } from './api-client.types';

export function injectOffers(api: ApiClientMethods) {
  api.getActiveOffers = function (params?: any) {
    return this.get('/offers', { params });
  };
  api.getOffer = function (id: string) {
    return this.get('/offers/' + id);
  };
  api.createOffer = function (data: any) {
    return this.post('/offers', data);
  };
  api.updateOffer = function (id: string, data: any) {
    return this.put('/offers/' + id, data);
  };
  api.deleteOffer = function (id: string) {
    return this.delete('/offers/' + id);
  };
  api.claimOffer = function (id: string) {
    return this.post('/offers/' + id + '/claim');
  };
  api.getNearbyBusinesses = function (params?: any) {
    return this.get('/businesses/nearby', { params });
  };
}
