import type { ApiClientMethods } from './api-client.types';

export function injectBusinessBookings(api: ApiClientMethods) {
  api.getMyBusinessBookings = function (params?: any) {
    return this.get('/business/bookings', { params });
  };
  api.getMyBusinessBooking = function (id: string) {
    return this.get(`/business/bookings/${id}`);
  };
  api.createBusinessBooking = function (data: any) {
    return this.post('/business/bookings', data);
  };
  api.updateBusinessBookingStatus = function (id: string, status: string) {
    return this.patch(`/business/bookings/${id}/status`, { status });
  };
  api.getBookingResources = function () {
    return this.get('/business/bookings/resources');
  };
  api.getBookingSlots = function () {
    return this.get('/business/bookings/slots');
  };
  api.updateBusinessBooking = function (id: string, data: any) {
    return this.put(`/business/bookings/${id}`, data);
  };
  api.deleteBusinessBooking = function (id: string) {
    return this.delete(`/business/bookings/${id}`);
  };
  api.sendBookingReminder = function (id: string, type: string, channel: string) {
    return this.post(`/business/bookings/${id}/reminder`, { type, channel });
  };
  api.getBookingCalendar = function (params?: any) {
    return this.get('/business/bookings/calendar', { params });
  };

  // Resource & Slot CRUD
  api.createBookingResource = function (data: any) {
    return this.post('/business/bookings/resources', data);
  };
  api.updateBookingResource = function (id: string, data: any) {
    return this.put('/business/bookings/resources/' + id, data);
  };
  api.deleteBookingResource = function (id: string) {
    return this.delete('/business/bookings/resources/' + id);
  };
  api.createBookingSlot = function (data: any) {
    return this.post('/business/bookings/slots', data);
  };
  api.updateBookingSlot = function (id: string, data: any) {
    return this.put('/business/bookings/slots/' + id, data);
  };
  api.deleteBookingSlot = function (id: string) {
    return this.delete('/business/bookings/slots/' + id);
  };
}
