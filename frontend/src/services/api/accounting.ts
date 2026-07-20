import type { ApiClientMethods } from './api-client.types';

export function injectAccounting(api: ApiClientMethods) {
  api.getExpenses = function (params?: any) {
    return this.get('/business/accounting', { params });
  };
  api.getExpense = function (id: string) {
    return this.get(`/business/accounting/${id}`);
  };
  api.createExpense = function (data: any) {
    return this.post('/business/accounting', data);
  };
  api.updateExpense = function (id: string, data: any) {
    return this.patch(`/business/accounting/${id}`, data);
  };
  api.deleteExpense = function (id: string) {
    return this.delete(`/business/accounting/${id}`);
  };
  api.getAccountingStats = function () {
    return this.get('/business/accounting/stats');
  };
  api.getMonthlyReport = function (year: number, month: number) {
    return this.get('/business/accounting/report', { params: { year, month } });
  };
  api.getBalanceSheet = function (year?: number) {
    return this.get('/business/accounting/reports/balance-sheet', {
      params: year !== undefined ? { year } : {},
    });
  };
  api.getIncomeStatement = function (year?: number) {
    return this.get('/business/accounting/reports/income-statement', {
      params: year !== undefined ? { year } : {},
    });
  };
  api.exportAccountingCSV = function (year?: number) {
    return this.get('/business/accounting/export/csv', {
      params: year !== undefined ? { year } : {},
      responseType: 'blob',
    });
  };
}
