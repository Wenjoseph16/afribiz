import type { ApiClientMethods } from './api-client.types';

export function injectPlanning(api: ApiClientMethods) {
  api.getPlanningCalendar = function (params?: any) {
    return this.get('/business/planning/calendar', { params });
  };
  api.getPlanningTasks = function (params?: any) {
    return this.get('/business/planning/tasks', { params });
  };
  api.getPlanningTask = function (id: string) {
    return this.get(`/business/planning/tasks/${id}`);
  };
  api.createPlanningTask = function (data: any) {
    return this.post('/business/planning/tasks', data);
  };
  api.updatePlanningTask = function (id: string, data: any) {
    return this.patch(`/business/planning/tasks/${id}`, data);
  };
  api.deletePlanningTask = function (id: string) {
    return this.delete(`/business/planning/tasks/${id}`);
  };
  api.getPlanningSchedules = function (params?: any) {
    return this.get('/business/planning/schedules', { params });
  };
  api.upsertPlanningSchedule = function (data: any) {
    return this.post('/business/planning/schedules', data);
  };
  api.deletePlanningSchedule = function (id: string) {
    return this.delete(`/business/planning/schedules/${id}`);
  };
  api.getPlanningStats = function () {
    return this.get('/business/planning/stats');
  };
  api.getPlanningLogs = function (params?: any) {
    return this.get('/business/planning/logs', { params });
  };
}
