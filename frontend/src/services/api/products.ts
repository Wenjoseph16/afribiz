import type { ApiClientMethods } from './api-client.types';

export function injectProducts(api: ApiClientMethods) {
  api.getMyProducts = function (params?: any) {
    return this.get('/business/products', { params });
  };
  api.getMyProduct = function (id: string) {
    return this.get(`/business/products/${id}`);
  };
  api.createProduct = function (data: any) {
    return this.post('/business/products', data);
  };
  api.updateProduct = function (id: string, data: any) {
    return this.put(`/business/products/${id}`, data);
  };
  api.deleteProduct = function (id: string) {
    return this.delete(`/business/products/${id}`);
  };
  api.duplicateProduct = function (id: string) {
    return this.post(`/business/products/${id}/duplicate`);
  };
  api.toggleProductActive = function (id: string) {
    return this.patch(`/business/products/${id}/toggle`);
  };
  api.updateProductStock = function (id: string, data: any) {
    return this.patch(`/business/products/${id}/stock`, data);
  };
  api.getProductCategories = function () {
    return this.get('/business/products/categories');
  };
  api.createProductCategory = function (data: any) {
    return this.post('/business/products/categories', data);
  };
  api.updateProductCategory = function (id: string, data: any) {
    return this.put(`/business/products/categories/${id}`, data);
  };
  api.deleteProductCategory = function (id: string) {
    return this.delete(`/business/products/categories/${id}`);
  };
  api.getProductStats = function () {
    return this.get('/business/products/stats');
  };
  api.getStockAlerts = function () {
    return this.get('/business/products/alerts');
  };
  api.exportProducts = function (params?: any) {
    return this.get('/business/products/export', { params });
  };
  api.importProducts = function (data: any) {
    return this.post('/business/products/import', data);
  };
  api.bulkDeleteProducts = function (ids: string[]) {
    return this.post('/business/products/bulk/delete', { ids });
  };
  api.bulkToggleProducts = function (ids: string[], isActive: boolean) {
    return this.patch('/business/products/bulk/toggle', { ids, isActive });
  };
  api.bulkUpdateProductStock = function (items: { id: string; stock: number }[]) {
    return this.patch('/business/products/bulk/stock', { items });
  };
  api.lookupBarcode = function (code: string) {
    return this.get(`/business/products/barcode/${encodeURIComponent(code)}`);
  };
}
