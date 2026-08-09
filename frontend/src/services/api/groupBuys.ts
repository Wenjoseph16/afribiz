import type { ApiClientMethods } from './api-client.types';

export function injectGroupBuys(api: ApiClientMethods) {
  api.getGroupBuys = function (params?: any) {
    return this.get('/business/group-buys', { params });
  };
  api.getGroupBuy = function (id: string) {
    return this.get('/business/group-buys/' + id);
  };
  api.createGroupBuy = function (data: any) {
    return this.post('/business/group-buys', data);
  };
  api.updateGroupBuy = function (id: string, data: any) {
    return this.put('/business/group-buys/' + id, data);
  };
  api.deleteGroupBuy = function (id: string) {
    return this.delete('/business/group-buys/' + id);
  };
  api.addGroupBuyParticipant = function (data: any) {
    return this.post('/business/group-buys/' + data.groupBuyId + '/participants', data);
  };
  api.removeGroupBuyParticipant = function (participantId: string) {
    return this.delete('/business/group-buys/participants/' + participantId);
  };
  api.confirmGroupBuyParticipant = function (participantId: string) {
    return this.post('/business/group-buys/participants/' + participantId + '/confirm');
  };
}
