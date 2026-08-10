import type { ApiClientMethods } from './api-client.types';

export function injectDebts(api: ApiClientMethods) {
  api.getDebts = function (params?: any) {
    return this.get('/business/finance/debts', { params });
  };
  api.getDebt = function (id: string) {
    return this.get(`/business/finance/debts/${id}`);
  };
  api.updateDebt = function (id: string, data: any) {
    return this.patch(`/business/finance/debts/${id}`, data);
  };
  api.registerDebtPayment = function (id: string, data: any) {
    return this.post(`/business/finance/debts/${id}/payment`, data);
  };
  api.updateDebtPriority = function (id: string, priority: string) {
    return this.patch(`/business/finance/debts/${id}/priority`, { priority });
  };
  api.getEscrows = function (params?: any) {
    return this.get('/business/finance/escrow', { params });
  };
  api.createEscrow = function (data: any) {
    return this.post('/business/finance/escrow', data);
  };
  api.releaseEscrow = function (id: string) {
    return this.post(`/business/finance/escrow/${id}/release`);
  };
  api.refundEscrow = function (id: string) {
    return this.post(`/business/finance/escrow/${id}/refund`);
  };
  api.disputeEscrow = function (id: string) {
    return this.post(`/business/finance/escrow/${id}/dispute`);
  };
  api.getEscrowById = function (id: string) {
    return this.get(`/business/finance/escrow/${id}`);
  };
  api.getEscrowStats = function () {
    return this.get('/business/finance/escrow/stats');
  };
  api.getClientEscrowById = function (id: string) {
    return this.get(`/payments/escrow/client/${id}`);
  };
  api.getClientRisks = function (params?: any) {
    return this.get('/business/finance/client-risks', { params });
  };
  api.getPaymentStats = function () {
    return this.get('/business/finance/stats');
  };
  api.getFinancialLogs = function (params?: any) {
    return this.get('/business/finance/logs', { params });
  };
  api.sendDebtReminder = function (debtId: string) {
    return this.post(`/business/finance/debts/${debtId}/reminder`);
  };
  api.runAutoReminders = function () {
    return this.post('/business/finance/auto-remind');
  };
  api.getReminderConfig = function () {
    return this.get('/business/finance/reminders/config');
  };
  api.updateReminderConfig = function (data: any) {
    return this.put('/business/finance/reminders/config', data);
  };
  api.attachDebtToOrder = function (data: any) {
    return this.post('/business/finance/debts/attach', data);
  };

  // Extended
  api.createDebt = function (data: any) {
    return this.post('/business/finance/debts', data);
  };
  api.deleteDebt = function (id: string) {
    return this.delete('/business/finance/debts/' + id);
  };
  api.updateClientRiskLevel = function (clientId: string, riskLevel: string) {
    return this.patch('/business/finance/client-risks/' + clientId, { riskLevel });
  };
  api.getReminders = function (params?: any) {
    return this.get('/business/finance/reminders', { params });
  };
  api.getLogs = function (params?: any) {
    return this.get('/business/finance/logs', { params });
  };
}
