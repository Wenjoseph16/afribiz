import type { ApiClientMethods } from './api-client.types';

export function injectFinance(api: ApiClientMethods) {
  api.getQuotes = function (params?: any) {
    return this.get('/business/finance/quotes', { params });
  };
  api.getQuote = function (id: string) {
    return this.get(`/business/finance/quotes/${id}`);
  };
  api.createQuote = function (data: any) {
    return this.post('/business/finance/quotes', data);
  };
  api.updateQuote = function (id: string, data: any) {
    return this.put(`/business/finance/quotes/${id}`, data);
  };
  api.updateQuoteStatus = function (id: string, status: string) {
    return this.put(`/business/finance/quotes/${id}/status`, { status });
  };
  api.convertQuoteToInvoice = function (id: string) {
    return this.post(`/business/finance/quotes/${id}/convert`);
  };
  api.deleteQuote = function (id: string) {
    return this.delete(`/business/finance/quotes/${id}`);
  };
  api.getInvoices = function (params?: any) {
    return this.get('/business/finance/invoices', { params });
  };
  api.getInvoice = function (id: string) {
    return this.get(`/business/finance/invoices/${id}`);
  };
  api.createInvoice = function (data: any) {
    return this.post('/business/finance/invoices', data);
  };
  api.updateInvoiceStatus = function (id: string, status: string) {
    return this.put(`/business/finance/invoices/${id}/status`, { status });
  };
  api.updateInvoicePayment = function (id: string, data: any) {
    return this.put(`/business/finance/invoices/${id}/payment`, data);
  };
  api.deleteInvoice = function (id: string) {
    return this.delete(`/business/finance/invoices/${id}`);
  };
  api.getFinanceStats = function () {
    return this.get('/business/finance/stats');
  };
  api.downloadInvoicePdf = function (id: string) {
    return this.get(`/business/finance/invoices/${id}/pdf`, { responseType: 'blob' });
  };
  api.downloadQuotePdf = function (id: string) {
    return this.get(`/business/finance/quotes/${id}/pdf`, { responseType: 'blob' });
  };
}
