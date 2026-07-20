import type { ApiClientMethods } from './api-client.types';

export function injectRentals(api: ApiClientMethods) {
  api.getMyRentals = function (params?: any) {
    return this.get('/business/rentals', { params });
  };
  api.getMyRental = function (id: string) {
    return this.get(`/business/rentals/${id}`);
  };
  api.createRental = function (data: any) {
    return this.post('/business/rentals', data);
  };
  api.updateRental = function (id: string, data: any) {
    return this.patch(`/business/rentals/${id}`, data);
  };
  api.deleteRental = function (id: string) {
    return this.delete(`/business/rentals/${id}`);
  };
  api.toggleRentalActive = function (id: string) {
    return this.patch(`/business/rentals/${id}/toggle`);
  };
  api.getRentalStats = function () {
    return this.get('/business/rentals/stats');
  };
}
