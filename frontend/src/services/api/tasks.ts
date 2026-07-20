import type { ApiClientMethods } from './api-client.types';

export function injectTasks(api: ApiClientMethods) {
  api.getAdvancedTasks = function (params?: any) {
    return this.get('/business/tasks/tasks', { params });
  };
  api.getAdvancedTask = function (id: string) {
    return this.get(`/business/tasks/tasks/${id}`);
  };
  api.createAdvancedTask = function (data: any) {
    return this.post('/business/tasks/tasks', data);
  };
  api.updateAdvancedTask = function (id: string, data: any) {
    return this.patch(`/business/tasks/tasks/${id}`, data);
  };
  api.deleteAdvancedTask = function (id: string) {
    return this.delete(`/business/tasks/tasks/${id}`);
  };
  api.getKanbanBoard = function (params?: any) {
    return this.get('/business/tasks/kanban', { params });
  };
  api.reorderTask = function (taskId: string, newStatus: string, newSortOrder: number) {
    return this.patch(`/business/tasks/tasks/${taskId}/reorder`, {
      status: newStatus,
      sortOrder: newSortOrder,
    });
  };
  api.getTaskCategories = function () {
    return this.get('/business/tasks/categories');
  };
  api.createTaskCategory = function (data: any) {
    return this.post('/business/tasks/categories', data);
  };
  api.addTaskChecklistItem = function (taskId: string, data: any) {
    return this.post(`/business/tasks/tasks/${taskId}/checklist`, data);
  };
  api.toggleTaskChecklistItem = function (taskId: string, itemId: string) {
    return this.patch(`/business/tasks/tasks/${taskId}/checklist/${itemId}`);
  };
  api.deleteTaskChecklistItem = function (taskId: string, itemId: string) {
    return this.delete(`/business/tasks/tasks/${taskId}/checklist/${itemId}`);
  };
  api.addTaskComment = function (taskId: string, data: any) {
    return this.post(`/business/tasks/tasks/${taskId}/comments`, data);
  };
  api.deleteTaskComment = function (taskId: string, commentId: string) {
    return this.delete(`/business/tasks/tasks/${taskId}/comments/${commentId}`);
  };
  api.startTaskTimer = function (taskId: string) {
    return this.post(`/business/tasks/tasks/${taskId}/timer/start`);
  };
  api.stopTaskTimer = function (taskId: string) {
    return this.post(`/business/tasks/tasks/${taskId}/timer/stop`);
  };
  api.addTaskResource = function (taskId: string, data: any) {
    return this.post(`/business/tasks/tasks/${taskId}/resources`, data);
  };
  api.deleteTaskResource = function (taskId: string, resourceId: string) {
    return this.delete(`/business/tasks/tasks/${taskId}/resources/${resourceId}`);
  };
  api.requestTaskValidation = function (taskId: string, data: any) {
    return this.post(`/business/tasks/tasks/${taskId}/validations`, data);
  };
  api.approveTaskValidation = function (taskId: string, validationId: string, data: any) {
    return this.patch(`/business/tasks/tasks/${taskId}/validations/${validationId}`, data);
  };
  api.getTaskStats = function () {
    return this.get('/business/tasks/tasks/stats');
  };
  api.getTaskHistory = function (taskId: string) {
    return this.get(`/business/tasks/tasks/${taskId}/history`);
  };
}
