import type { ApiClientMethods } from './api-client.types';

export function injectAffiliates(api: ApiClientMethods) {
  api.createAffiliateLink = function (data: any) {
    return this.post('/affiliate', data);
  };
  api.getAffiliateLinks = function () {
    return this.get('/affiliate');
  };
  api.deleteAffiliateLink = function (id: string) {
    return this.delete(`/affiliate/${id}`);
  };
  api.resolveAffiliateLink = function (code: string) {
    return this.get('/affiliate/resolve', { params: { code } });
  };
}
