import type { ApiClientMethods } from './api-client.types';

export function injectFaq(api: ApiClientMethods) {
  api.getPublicBusinessFaqs = function (slug: string) {
    return this.get(`/business/${slug}/faqs`);
  };
  api.getMyFaqs = function () {
    return this.get('/business/faqs');
  };
  api.createFaq = function (data: {
    question: string;
    answer: string;
    category?: string;
    sortOrder?: number;
  }) {
    return this.post('/business/faqs', data);
  };
  api.updateFaq = function (
    faqId: string,
    data: {
      question?: string;
      answer?: string;
      category?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    return this.put(`/business/faqs/${faqId}`, data);
  };
  api.deleteFaq = function (faqId: string) {
    return this.delete(`/business/faqs/${faqId}`);
  };
  api.reorderFaqs = function (faqIds: string[]) {
    return this.post('/business/faqs/reorder', { faqIds });
  };
}
