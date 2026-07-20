import type { ApiClientMethods } from './api-client.types';

export function injectPortfolio(api: ApiClientMethods) {
  api.getMyPortfolioItems = function (params?: any) {
    return this.get('/business/portfolio', { params });
  };
  api.getMyPortfolioItem = function (id: string) {
    return this.get(`/business/portfolio/${id}`);
  };
  api.createPortfolioItem = function (data: any) {
    return this.post('/business/portfolio', data);
  };
  api.updatePortfolioItem = function (id: string, data: any) {
    return this.patch(`/business/portfolio/${id}`, data);
  };
  api.deletePortfolioItem = function (id: string) {
    return this.delete(`/business/portfolio/${id}`);
  };
  api.getPortfolioCategories = function () {
    return this.get('/business/portfolio/categories');
  };
  api.createPortfolioCategory = function (data: any) {
    return this.post('/business/portfolio/categories', data);
  };
  api.updatePortfolioCategory = function (id: string, data: any) {
    return this.patch(`/business/portfolio/categories/${id}`, data);
  };
  api.deletePortfolioCategory = function (id: string) {
    return this.delete(`/business/portfolio/categories/${id}`);
  };
  api.getPortfolioTestimonials = function (params?: any) {
    return this.get('/business/portfolio/testimonials', { params });
  };
  api.createPortfolioTestimonial = function (data: any) {
    return this.post('/business/portfolio/testimonials', data);
  };
  api.updatePortfolioTestimonial = function (id: string, data: any) {
    return this.patch(`/business/portfolio/testimonials/${id}`, data);
  };
  api.deletePortfolioTestimonial = function (id: string) {
    return this.delete(`/business/portfolio/testimonials/${id}`);
  };
  api.getPortfolioStats = function () {
    return this.get('/business/portfolio/stats');
  };
}
