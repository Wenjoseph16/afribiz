import type { ApiClientMethods } from './api-client.types';

export function injectEmployees(api: ApiClientMethods) {
  api.getMyEmployees = function (params?: any) {
    return this.get('/business/employees', { params });
  };
  api.getMyEmployee = function (id: string) {
    return this.get(`/business/employees/${id}`);
  };
  api.createEmployee = function (data: any) {
    return this.post('/business/employees', data);
  };
  api.updateEmployee = function (id: string, data: any) {
    return this.patch(`/business/employees/${id}`, data);
  };
  api.deleteEmployee = function (id: string) {
    return this.delete(`/business/employees/${id}`);
  };
  api.getEmployeeRoles = function () {
    return this.get('/business/employees/roles/list');
  };
  api.createEmployeeRole = function (data: any) {
    return this.post('/business/employees/roles', data);
  };
  api.updateEmployeeRole = function (id: string, data: any) {
    return this.patch(`/business/employees/roles/${id}`, data);
  };
  api.deleteEmployeeRole = function (id: string) {
    return this.delete(`/business/employees/roles/${id}`);
  };
  api.getEmployeeAttendances = function (params?: any) {
    return this.get('/business/employees/attendances', { params });
  };
  api.clockIn = function (data: any) {
    return this.post('/business/employees/attendance/clock-in', data);
  };
  api.clockOut = function (id: string) {
    return this.patch(`/business/employees/attendance/clock-out/${id}`);
  };
  api.getEmployeeStats = function () {
    return this.get('/business/employees/stats');
  };
  api.getEmployeeDocuments = function (employeeId: string) {
    return this.get(`/business/employees/${employeeId}/documents`);
  };
  api.createEmployeeDocument = function (data: any) {
    return this.post('/business/employees/documents', data);
  };
  api.deleteEmployeeDocument = function (id: string) {
    return this.delete(`/business/employees/documents/${id}`);
  };
}
