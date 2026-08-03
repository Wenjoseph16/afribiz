import type { ApiClientMethods } from './api-client.types';

export function injectOrders(api: ApiClientMethods) {
  api.getOrders = function (params?: any) {
    return this.get('/orders', { params });
  };
  api.getOrder = function (id: string) {
    return this.get(`/orders/${id}`);
  };
  api.getOrderTimeline = function (id: string) {
    return this.get(`/orders/${id}/timeline`);
  };
  api.updateOrder = function (id: string, data: any) {
    return this.put(`/orders/${id}`, data);
  };
  api.getMyBusinessOrders = function (params?: any) {
    return this.get('/business/orders', { params });
  };
  api.getMyBusinessOrder = function (id: string) {
    return this.get(`/business/orders/${id}`);
  };
  api.createBusinessOrder = function (data: any) {
    return this.post('/business/orders', data);
  };
  api.updateBusinessOrderStatus = function (id: string, status: string, reason?: string) {
    return this.put(`/business/orders/${id}/status`, { status, reason });
  };
  api.updateBusinessOrderDelivery = function (id: string, deliveryStatus: string, notes?: string) {
    return this.put(`/business/orders/${id}/delivery`, { deliveryStatus, notes });
  };
  api.updateBusinessOrderPayment = function (id: string, data: any) {
    return this.put(`/business/orders/${id}/payment`, data);
  };
  api.deleteBusinessOrder = function (id: string) {
    return this.delete(`/business/orders/${id}`);
  };
  api.getBusinessOrderStats = function () {
    return this.get('/business/orders/stats');
  };
  api.getBusinessDebts = function (params?: any) {
    return this.get('/business/orders/debts/list', { params });
  };
  api.payBusinessDebt = function (id: string, amount: number) {
    return this.post(`/business/orders/debts/${id}/pay`, { amount });
  };
  api.settleBusinessDebt = function (id: string) {
    return this.post(`/business/orders/debts/${id}/settle`);
  };

  // Extended methods
  api.cancelOrder = function (id: string, reason?: string) {
    return this.post(`/orders/${id}/cancel`, { reason });
  };
  api.getOrderPayments = function (orderId: string) {
    return this.get(`/orders/${orderId}/payments`);
  };
  api.initiateHybridPayment = function (orderId: string, data: any) {
    return this.post(`/orders/${orderId}/payments/hybrid`, data);
  };
  api.verifyPayment = function (paymentId: string, data: any) {
    return this.post(`/payments/${paymentId}/verify`, data);
  };
}
