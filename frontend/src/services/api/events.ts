import type { ApiClientMethods } from './api-client.types';

export function injectEvents(api: ApiClientMethods) {
  api.getMyEvents = function (params?: any) {
    return this.get('/business/events', { params });
  };
  api.getMyEvent = function (id: string) {
    return this.get(`/business/events/${id}`);
  };
  api.createEvent = function (data: any) {
    return this.post('/business/events', data);
  };
  api.updateEvent = function (id: string, data: any) {
    return this.patch(`/business/events/${id}`, data);
  };
  api.deleteEvent = function (id: string) {
    return this.delete(`/business/events/${id}`);
  };
  api.getEventTickets = function (eventId: string) {
    return this.get(`/business/events/${eventId}/tickets`);
  };
  api.createEventTicket = function (eventId: string, data: any) {
    return this.post(`/business/events/${eventId}/tickets`, data);
  };
  api.updateEventTicket = function (eventId: string, ticketId: string, data: any) {
    return this.patch(`/business/events/${eventId}/tickets/${ticketId}`, data);
  };
  api.deleteEventTicket = function (eventId: string, ticketId: string) {
    return this.delete(`/business/events/${eventId}/tickets/${ticketId}`);
  };
  api.getEventParticipants = function (eventId: string) {
    return this.get(`/business/events/${eventId}/participants`);
  };
  api.registerEventParticipant = function (eventId: string, data: any) {
    return this.post(`/business/events/${eventId}/participants`, data);
  };
  api.getEventDashboardStats = function () {
    return this.get('/business/events/dashboard/stats');
  };
  api.updateEventParticipantStatus = function (
    eventId: string,
    participantId: string,
    status: string
  ) {
    return this.patch(`/business/events/${eventId}/participants/${participantId}/status`, {
      status,
    });
  };
  api.getEventScans = function (eventId: string) {
    return this.get(`/business/events/${eventId}/scans`);
  };
  api.scanEventTicket = function (eventId: string, ticketRef: string) {
    return this.post(`/business/events/${eventId}/scan`, { ticketRef });
  };
  api.getEventPromotions = function (eventId: string) {
    return this.get(`/business/events/${eventId}/promotions`);
  };
  api.createEventPromotion = function (eventId: string, data: any) {
    return this.post(`/business/events/${eventId}/promotions`, data);
  };
  api.deleteEventPromotion = function (eventId: string, promoId: string) {
    return this.delete(`/business/events/${eventId}/promotions/${promoId}`);
  };
  api.getEventGallery = function (eventId: string) {
    return this.get(`/business/events/${eventId}/gallery`);
  };
  api.addEventGalleryItem = function (eventId: string, data: any) {
    return this.post(`/business/events/${eventId}/gallery`, data);
  };
  api.deleteEventGalleryItem = function (eventId: string, itemId: string) {
    return this.delete(`/business/events/${eventId}/gallery/${itemId}`);
  };
  api.getEventPartners = function (eventId: string) {
    return this.get(`/business/events/${eventId}/partners`);
  };
  api.addEventPartner = function (eventId: string, data: any) {
    return this.post(`/business/events/${eventId}/partners`, data);
  };
  api.removeEventPartner = function (eventId: string, partnerId: string) {
    return this.delete(`/business/events/${eventId}/partners/${partnerId}`);
  };
  api.getEventStats = function (id: string) {
    return this.get(`/business/events/${id}/stats`);
  };
  api.getPublicEvent = function (slug: string, eventId: string) {
    return this.get(`/business/${slug}/events/${eventId}`);
  };
  api.registerPublicParticipant = function (slug: string, eventId: string, data: any) {
    return this.post(`/business/${slug}/events/${eventId}/register`, data);
  };
  api.getMyTicket = function (eventId: string) {
    return this.get(`/client-events/my-ticket/${eventId}`);
  };
}
