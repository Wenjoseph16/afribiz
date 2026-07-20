import type { ApiClientMethods } from './api-client.types';

export function injectPayments(api: ApiClientMethods) {
  api.getPayments = function (params?: any) {
    return this.get('/payments', { params });
  };
  api.getPayment = function (id: string) {
    return this.get(`/payments/${id}`);
  };
  api.getWallet = function () {
    return this.get('/payments/wallet');
  };
  api.getClientEscrows = function (params?: any) {
    return this.get('/payments/escrow/client', { params });
  };
  api.confirmClientEscrow = function (id: string) {
    return this.post(`/payments/escrow/client/${id}/confirm`);
  };
  api.disputeClientEscrow = function (id: string, data: { reason: string }) {
    return this.post(`/payments/escrow/client/${id}/dispute`, data);
  };
  api.getClientDebts = function (params?: any) {
    return this.get('/payments/debts/client', { params });
  };
  api.payClientDebt = function (
    id: string,
    data: { amount: number; paymentMethod?: string; notes?: string }
  ) {
    return this.post(`/payments/debts/client/${id}/pay`, data);
  };
  api.initiatePayment = function (data: {
    provider: string;
    amount: number;
    phone?: string;
    paymentMethodId?: string;
    orderId?: string;
    currency?: string;
    mode?: string;
    callbackUrl?: string;
    customerName?: string;
    customerEmail?: string;
  }) {
    return this.post('/payments/processor/initiate', data);
  };
  api.addPaymentProof = function (paymentId: string, data: { imageUrl: string; notes?: string }) {
    return this.post(`/payments/${paymentId}/proof`, data);
  };

  // Extended
  api.getPaymentProcessorTransactions = function () {
    return this.get('/payments/processor/transactions');
  };
  api.getEscrowSteps = function (escrowId: string) {
    return this.get('/escrow/' + escrowId + '/steps');
  };
  api.releaseEscrowStep = function (escrowId: string, stepNumber: number) {
    return this.post('/escrow/' + escrowId + '/release-step/' + stepNumber);
  };
}
