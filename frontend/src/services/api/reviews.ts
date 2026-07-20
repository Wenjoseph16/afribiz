import type { ApiClientMethods } from './api-client.types';

export function injectReviews(api: ApiClientMethods) {
  api.getReviews = function (params?: any) {
    return this.get('/reviews', { params });
  };
  api.respondToReview = function (reviewId: string, response: string) {
    return this.post(`/reviews/${reviewId}/respond`, { response });
  };
  api.createReview = function (data: FormData) {
    return this.post('/reviews', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  api.updateReview = function (id: string, data: any) {
    return this.patch('/reviews/' + id, data);
  };
  api.deleteMyReview = function (id: string) {
    return this.delete('/reviews/' + id);
  };
}
