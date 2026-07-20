import type { ApiClientMethods } from './api-client.types';

export function injectBusinessExtended(api: ApiClientMethods) {
  api.getBusinessStatsAggregated = function () {
    return this.get('/business/stats/aggregated');
  };
  api.getBusinessConversations = function () {
    return this.get('/business/conversations');
  };

  // Media & Public
  api.createBusinessPortfolioMedia = function (data: any) {
    return this.post('/business/portfolio/media', data);
  };
  api.sendQuoteRequest = function (slug: string, data: any) {
    return this.post('/public/businesses/' + slug + '/quote-request', data);
  };
  api.createPublicBooking = function (data: any) {
    return this.post('/public/bookings', data);
  };
}
