import type { ApiClientMethods } from './api-client.types';

export function injectMediaCommerce(api: ApiClientMethods) {
  api.getMediaCommerceData = function (type: string, id: string | undefined) {
    return this.get('/media/' + type + '/' + id + '/commerce');
  };
  api.mediaAddToCart = function (data: any) {
    return this.post('/media/add-to-cart', data);
  };
  api.mediaCreateOrder = function (data: any) {
    return this.post('/media/order', data);
  };
  api.mediaBook = function (data: any) {
    return this.post('/media/book', data);
  };
  api.mediaInstallModule = function (data: any) {
    return this.post('/media/install-module', data);
  };
}
