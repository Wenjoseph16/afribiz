import type { ApiClientMethods } from './api-client.types';

export function injectLives(api: ApiClientMethods) {
  api.getActiveLives = function (params?: any) {
    return this.get('/lives', { params });
  };
  api.getLive = function (id: string) {
    return this.get('/lives/' + id);
  };
  api.createLive = function (data: any) {
    return this.post('/lives', data);
  };
  api.startLive = function (id: string, streamUrl?: string) {
    return this.post('/lives/' + id + '/start', { streamUrl });
  };
  api.endLive = function (id: string) {
    return this.post('/lives/' + id + '/end');
  };
  api.deleteLive = function (id: string) {
    return this.delete('/lives/' + id);
  };
  api.addLiveProduct = function (liveId: string, data: any) {
    return this.post('/lives/' + liveId + '/products', data);
  };
  api.getLiveChats = function (liveId: string) {
    return this.get('/lives/' + liveId + '/chats');
  };
  api.sendLiveChat = function (liveId: string, message: string) {
    return this.post('/lives/' + liveId + '/chat', { message });
  };
  api.joinLiveRoom = function (liveId: string) {
    return this.post('/lives/' + liveId + '/join', {});
  };
  api.leaveLiveRoom = function (liveId: string) {
    return this.post('/lives/' + liveId + '/leave', {});
  };
  api.sendLiveReaction = function (liveId: string, emoji: string) {
    return this.post('/lives/' + liveId + '/reactions', { emoji });
  };
  api.getLiveStats = function () {
    return this.get('/lives/stats');
  };
}
