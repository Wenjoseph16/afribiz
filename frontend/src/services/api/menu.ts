import type { ApiClientMethods } from './api-client.types';

export function injectMenu(api: ApiClientMethods) {
  api.getMyMenuItems = function (params?: any) {
    return this.get('/business/menu/items', { params });
  };
  api.getMyMenuItem = function (id: string) {
    return this.get(`/business/menu/items/${id}`);
  };
  api.createMenuItem = function (data: any) {
    return this.post('/business/menu/items', data);
  };
  api.updateMenuItem = function (id: string, data: any) {
    return this.put(`/business/menu/items/${id}`, data);
  };
  api.deleteMenuItem = function (id: string) {
    return this.delete(`/business/menu/items/${id}`);
  };
  api.toggleMenuItemActive = function (id: string) {
    return this.patch(`/business/menu/items/${id}/toggle`);
  };
  api.updateMenuItemStatus = function (id: string, status: string) {
    return this.patch(`/business/menu/items/${id}/status`, { status });
  };
  api.getMenuCategories = function () {
    return this.get('/business/menu/categories');
  };
  api.createMenuCategory = function (data: any) {
    return this.post('/business/menu/categories', data);
  };
  api.updateMenuCategory = function (id: string, data: any) {
    return this.put(`/business/menu/categories/${id}`, data);
  };
  api.deleteMenuCategory = function (id: string) {
    return this.delete(`/business/menu/categories/${id}`);
  };
  api.getMenuOrders = function (params?: any) {
    return this.get('/business/menu/orders', { params });
  };
  api.getMenuOrder = function (id: string) {
    return this.get(`/business/menu/orders/${id}`);
  };
  api.createMenuOrder = function (data: any) {
    return this.post('/business/menu/orders', data);
  };
  api.updateMenuOrderStatus = function (id: string, status: string) {
    return this.patch(`/business/menu/orders/${id}/status`, { status });
  };
  api.getMenuOrderStats = function () {
    return this.get('/business/menu/orders/stats');
  };
  api.getMenuTables = function () {
    return this.get('/business/menu/tables');
  };
  api.createMenuTable = function (data: any) {
    return this.post('/business/menu/tables', data);
  };
  api.updateMenuTable = function (id: string, data: any) {
    return this.put(`/business/menu/tables/${id}`, data);
  };
  api.deleteMenuTable = function (id: string) {
    return this.delete(`/business/menu/tables/${id}`);
  };
  api.updateMenuTableStatus = function (id: string, status: string) {
    return this.patch(`/business/menu/tables/${id}/status`, { status });
  };
  api.getMenuIngredients = function (params?: any) {
    return this.get('/business/menu/ingredients', { params });
  };
  api.createMenuIngredient = function (data: any) {
    return this.post('/business/menu/ingredients', data);
  };
  api.updateMenuIngredient = function (id: string, data: any) {
    return this.put(`/business/menu/ingredients/${id}`, data);
  };
  api.deleteMenuIngredient = function (id: string) {
    return this.delete(`/business/menu/ingredients/${id}`);
  };
  api.adjustIngredientStock = function (id: string, data: any) {
    return this.post(`/business/menu/ingredients/${id}/stock`, data);
  };
  api.getMenuStats = function () {
    return this.get('/business/menu/stats');
  };
}
