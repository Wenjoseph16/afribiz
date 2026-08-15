import type { ApiClientMethods } from './api-client.types';

/** Caisse journalière (Chantier 4 — Brique A). */
export function injectCash(api: ApiClientMethods) {
  api.getCashWidget = function () {
    return this.get('/business/cash/widget');
  };
  api.getTodayCash = function () {
    return this.get('/business/cash/today');
  };
  api.getCashHistory = function (params?: any) {
    return this.get('/business/cash/history', { params });
  };
  api.openCashSession = function (data: { openingBalance: number }) {
    return this.post('/business/cash/open', data);
  };
  api.addCashMovement = function (data: any) {
    return this.post('/business/cash/movement', data);
  };
  api.closeCashSession = function (data: { actualBalance: number; closingNotes?: string }) {
    return this.post('/business/cash/close', data);
  };
}
