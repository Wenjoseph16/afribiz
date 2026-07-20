import type { ApiClientMethods } from './api-client.types';

export function injectRooms(api: ApiClientMethods) {
  api.getMyRooms = function (params?: any) {
    return this.get('/business/rooms', { params });
  };
  api.getMyRoom = function (id: string) {
    return this.get(`/business/rooms/${id}`);
  };
  api.createRoom = function (data: any) {
    return this.post('/business/rooms', data);
  };
  api.updateRoom = function (id: string, data: any) {
    return this.put(`/business/rooms/${id}`, data);
  };
  api.deleteRoom = function (id: string) {
    return this.delete(`/business/rooms/${id}`);
  };
  api.toggleRoomActive = function (id: string) {
    return this.patch(`/business/rooms/${id}/toggle`);
  };
  api.updateRoomStatus = function (id: string, status: string) {
    return this.patch(`/business/rooms/${id}/status`, { status });
  };
  api.blockRoomDates = function (id: string, data: any) {
    return this.post(`/business/rooms/${id}/block`, data);
  };
  api.duplicateRoom = function (id: string) {
    return this.post(`/business/rooms/${id}/duplicate`);
  };
  api.exportRooms = function (params?: any) {
    return this.get('/business/rooms/export', { params });
  };
  api.importRooms = function (data: any) {
    return this.post('/business/rooms/import', data);
  };
  api.bulkDeleteRooms = function (ids: string[]) {
    return this.post('/business/rooms/bulk/delete', { ids });
  };
  api.bulkToggleRooms = function (ids: string[], isActive: boolean) {
    return this.patch('/business/rooms/bulk/toggle', { ids, isActive });
  };
  api.getRoomStats = function () {
    return this.get('/business/rooms/stats');
  };
}
