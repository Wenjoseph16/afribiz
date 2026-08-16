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

/** Cockpit Santé du Boss (Chantier 5 — Brique B). */
export function injectCockpit(api: ApiClientMethods) {
  api.getBossCockpit = function () {
    return this.get('/business/cockpit');
  };
  api.getBusinessCockpit = function (businessId: string, params?: any) {
    return this.get(`/business/cockpit/${businessId}`, { params });
  };
}
