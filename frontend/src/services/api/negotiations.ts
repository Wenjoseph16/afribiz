import type { ApiClientMethods } from './api-client.types';

export function injectNegotiations(api: ApiClientMethods) {
  // ── PUBLIC : le client propose un prix ──
  api.createNegotiationOffer = function (data: {
    itemType: string;
    itemId: string;
    proposedPrice: number;
    message?: string;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
  }) {
    return this.post('/public/negotiations', data);
  };

  // ── PUBLIC : résoudre le lien éphémère (prix accordé figé) ──
  api.resolveNegotiatedToken = function (token: string) {
    return this.get(`/public/negotiated/${token}`);
  };

  // ── PUBLIC : commander au prix accordé (1 usage) ──
  api.createNegotiatedOrder = function (
    token: string,
    data: {
      paymentMethod?: string;
      contactName?: string;
      contactPhone?: string;
      deliveryAddress?: string;
      notes?: string;
    }
  ) {
    return this.post(`/public/negotiated/${token}/order`, data);
  };

  // ── BUSINESS : liste + détail des offres ──
  api.listNegotiations = function (params?: any) {
    return this.get('/business/negotiations', { params });
  };
  api.getNegotiation = function (id: string) {
    return this.get(`/business/negotiations/${id}`);
  };

  // ── BUSINESS : accepter / contre-proposer / refuser ──
  api.acceptNegotiation = function (id: string) {
    return this.post(`/business/negotiations/${id}/accept`);
  };
  api.counterNegotiation = function (id: string, counterPrice: number, message?: string) {
    return this.post(`/business/negotiations/${id}/counter`, { counterPrice, message });
  };
  api.declineNegotiation = function (id: string) {
    return this.post(`/business/negotiations/${id}/decline`);
  };
}
