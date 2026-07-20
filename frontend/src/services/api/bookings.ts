import type { ApiClientMethods } from './api-client.types';

export function injectBookings(api: ApiClientMethods) {
  api.getBookings = function (params?: any) {
    return this.get('/bookings', { params });
  };
  api.getBooking = function (id: string) {
    return this.get(`/bookings/${id}`);
  };
  api.cancelMyBooking = function (id: string, reason?: string) {
    return this.post(`/bookings/${id}/cancel`, { reason });
  };
  api.rescheduleMyBooking = function (id: string, startDate: string, endDate?: string) {
    return this.put(`/bookings/${id}/reschedule`, { startDate, endDate });
  };
  api.createRentalBooking = function (data: {
    rentalId: string;
    startDate: string;
    endDate: string;
    notes?: string;
  }) {
    return this.post('/bookings/rental', data);
  };
  api.prolongRentalBooking = function (
    id: string,
    data: { newEndDate: string; additionalNotes?: string }
  ) {
    return this.post(`/bookings/${id}/prolong`, data);
  };
}
