import type { ApiClientMethods } from './api-client.types';

export function injectVerification(api: ApiClientMethods) {
  api.getVerification = function () {
    return this.get('/business/verification');
  };
  api.upgradeToOr = function (data: { identityDocument: string; responsiblePhoto: string }) {
    return this.post('/business/verification/upgrade/or', data);
  };
  api.upgradeToPlatine = function () {
    return this.post('/business/verification/upgrade/platine');
  };
}
