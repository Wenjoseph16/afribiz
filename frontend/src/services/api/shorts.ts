import type { ApiClientMethods } from './api-client.types';

export function injectShorts(api: ApiClientMethods) {
  api.getShorts = function (params?: any) {
    return this.get('/shorts', { params });
  };
  api.getShort = function (id: string) {
    return this.get('/shorts/' + id);
  };
  api.createShort = function (data: any) {
    return this.post('/shorts', data);
  };
  api.updateShort = function (id: string, data: any) {
    return this.put('/shorts/' + id, data);
  };
  api.deleteShort = function (id: string) {
    return this.delete('/shorts/' + id);
  };
  api.likeShort = function (id: string) {
    return this.post('/shorts/' + id + '/like');
  };
  api.addShortComment = function (id: string, content: string) {
    return this.post('/shorts/' + id + '/comments', { content });
  };
  api.getShortComments = function (id: string) {
    return this.get('/shorts/' + id + '/comments');
  };
  api.viewShort = function (id: string) {
    return this.post('/shorts/' + id + '/view');
  };
  api.shareShort = function (id: string) {
    return this.post('/shorts/' + id + '/share');
  };
  api.saveShort = function (id: string) {
    return this.post('/shorts/' + id + '/save');
  };
}
