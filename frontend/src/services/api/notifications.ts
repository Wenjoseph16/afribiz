import type { ApiClientMethods } from './api-client.types';

export function injectNotifications(api: ApiClientMethods) {
  api.getNotifications = function (params?: any) {
    return this.get('/notifications', { params });
  };
  api.getUnreadCount = function () {
    return this.get('/notifications/unread-count');
  };
  api.markNotificationRead = function (id: string) {
    return this.patch(`/notifications/${id}/read`);
  };
  api.markAllNotificationsRead = function () {
    return this.patch('/notifications/read-all');
  };
  api.deleteNotification = function (id: string) {
    return this.delete(`/notifications/${id}`);
  };
  api.getNotificationPreferences = function () {
    return this.get('/notifications/preferences');
  };
  api.updateNotificationPreferences = function (data: any) {
    return this.put('/notifications/preferences', data);
  };
}
