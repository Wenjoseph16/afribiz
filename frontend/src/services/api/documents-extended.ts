import type { ApiClientMethods } from './api-client.types';

export function injectDocumentsExtended(api: ApiClientMethods) {
  api.signDocument = function (token: string, data: any) {
    return this.post('/documents/sign/' + token, data);
  };
}
