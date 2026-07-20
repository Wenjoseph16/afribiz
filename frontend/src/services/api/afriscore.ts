import type { ApiClientMethods } from './api-client.types';

export function injectAfriscore(api: ApiClientMethods) {
  api.getMyScore = function () {
    return this.get('/afriscore/mine');
  };
  api.getPublicScore = function (businessId: string) {
    return this.get(`/afriscore/${businessId}`);
  };
  api.getScoreHistory = function () {
    return this.get('/afriscore/mine/history');
  };
  api.recomputeMyScore = function () {
    return this.post('/afriscore/mine/recompute');
  };
  api.getMyBadges = function () {
    return this.get('/afriscore/mine/badges');
  };
  api.getMyConsents = function () {
    return this.get('/afriscore/consent');
  };
  api.createConsent = function (data: any) {
    return this.post('/afriscore/consent', data);
  };
  api.updateConsent = function (id: string, data: any) {
    return this.put('/afriscore/consent', data);
  };
  api.revokeConsent = function (id: string) {
    return this.delete('/afriscore/consent');
  };
}
