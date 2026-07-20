import type { ApiClientMethods } from './api-client.types';

export function injectBusiness(api: ApiClientMethods) {
  api.createBusiness = function (data: any) {
    return this.post('/business/onboarding', data);
  };
  api.getMyBusiness = function () {
    return this.get('/business/me');
  };
  api.getPublicBusiness = function (slug: string) {
    return this.get(`/business/${slug}/public`);
  };
  api.getBusinessStats = function () {
    return this.get('/business/stats');
  };
  api.getBusinessClients = function (params?: any) {
    return this.get('/business/clients', { params });
  };
  api.getBusinessMenu = function (slug?: string) {
    const url = slug ? `/business/${slug}/menu` : '/business/menu';
    return this.get(url);
  };
  api.getBusinessProducts = function (slug?: string) {
    const url = slug ? `/business/${slug}/products` : '/business/products';
    return this.get(url);
  };
  api.getBusinessServices = function (slug?: string) {
    const url = slug ? `/business/${slug}/services` : '/business/services';
    return this.get(url);
  };
  api.getBusinessRooms = function (slug?: string) {
    const url = slug ? `/business/${slug}/rooms` : '/business/rooms';
    return this.get(url);
  };
  api.getBusinessEvents = function (slug?: string) {
    const url = slug ? `/business/${slug}/events` : '/business/events';
    return this.get(url);
  };
  api.getBusinessRentals = function (slug?: string) {
    const url = slug ? `/business/${slug}/rentals` : '/business/rentals';
    return this.get(url);
  };
  api.getBusinessBookings = function (slug?: string) {
    const url = slug ? `/business/${slug}/bookings` : '/business/bookings';
    return this.get(url);
  };
  api.getBusinessReviews = function (slug?: string) {
    const url = slug ? `/business/${slug}/reviews` : '/business/reviews';
    return this.get(url);
  };
  api.getBusinessPromotions = function (slug?: string) {
    const url = slug ? `/business/${slug}/promotions` : '/business/promotions';
    return this.get(url);
  };
  api.getBusinessPartners = function (slug?: string) {
    const url = slug ? `/business/${slug}/partners` : '/business/partners';
    return this.get(url);
  };
  api.getBusinessPortfolio = function (slug?: string) {
    const url = slug ? `/business/${slug}/portfolio` : '/business/portfolio';
    return this.get(url);
  };
  api.getBusinessTrainings = function (slug?: string) {
    const url = slug ? `/business/${slug}/trainings` : '/trainings/business';
    return this.get(url);
  };
  api.getPublicPagePreview = function () {
    return this.get('/business/public-page-preview');
  };
  api.updatePublicPage = function (data: any) {
    return this.put('/business/public-page', data);
  };
}
