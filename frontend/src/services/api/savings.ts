import type { ApiClientMethods } from './api-client.types';

export function injectSavings(api: ApiClientMethods) {
  // Groupes
  api.getSavingsGroups = function (params?: any) {
    return this.get('/business/savings-groups', { params });
  };
  api.getSavingsGroup = function (id: string) {
    return this.get('/business/savings-groups/' + id);
  };
  api.createSavingsGroup = function (data: any) {
    return this.post('/business/savings-groups', data);
  };
  api.updateSavingsGroup = function (id: string, data: any) {
    return this.put('/business/savings-groups/' + id, data);
  };
  api.deleteSavingsGroup = function (id: string) {
    return this.delete('/business/savings-groups/' + id);
  };
  api.getSavingsStats = function () {
    return this.get('/business/savings-groups/stats');
  };

  // Membres
  api.addSavingsMember = function (data: any) {
    return this.post('/business/savings-groups/' + data.groupId + '/members', data);
  };
  api.removeSavingsMember = function (memberId: string) {
    return this.delete('/business/savings-groups/members/' + memberId);
  };
  api.getSavingsMemberScore = function (memberId: string) {
    return this.get('/business/savings-groups/members/' + memberId + '/score');
  };

  // Cycles
  api.startSavingsCycle = function (groupId: string, data?: any) {
    return this.post('/business/savings-groups/' + groupId + '/cycles', data);
  };
  api.closeSavingsCycle = function (cycleId: string) {
    return this.put('/business/savings-groups/cycles/' + cycleId + '/close');
  };
  api.validateSavingsCycle = function (cycleId: string) {
    return this.post('/business/savings-groups/cycles/' + cycleId + '/validate');
  };
  api.processCyclePayout = function (cycleId: string) {
    return this.post('/business/savings-groups/cycles/' + cycleId + '/payout');
  };
  api.getCyclePayoutStatus = function (cycleId: string) {
    return this.get('/business/savings-groups/cycles/' + cycleId + '/status');
  };

  // Cotisations
  api.recordContribution = function (data: any) {
    return this.post('/business/savings-groups/contributions', data);
  };

  // Prêts
  api.getSavingsLoans = function (params?: any) {
    return this.get('/business/savings-groups/loans/list', { params });
  };
  api.createSavingsLoan = function (data: any) {
    return this.post('/business/savings-groups/loans', data);
  };
  api.approveSavingsLoan = function (loanId: string) {
    return this.put('/business/savings-groups/loans/' + loanId + '/approve');
  };
  api.repaySavingsLoan = function (loanId: string, amount: number, method?: string) {
    return this.post('/business/savings-groups/loans/' + loanId + '/repay', { amount, method });
  };

  // Escrows
  api.getGroupEscrows = function (groupId: string) {
    return this.get('/business/savings-groups/' + groupId + '/escrows');
  };
}
