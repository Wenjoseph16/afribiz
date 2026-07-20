import type { ApiClientMethods } from './api-client.types';

export function injectMessagesExtended(api: ApiClientMethods) {
  api.getConversationsByType = function (type?: string) {
    return this.get('/messages/conversations', { params: { type } });
  };
  api.sendMessageDirect = function (payload: {
    conversationId: string;
    content: string;
    attachment?: string;
    attachmentType?: string;
  }) {
    return this.post('/messages', payload);
  };

  // Search & Reactions
  api.getBusinessConversations = function () {
    return this.get('/messages/business-conversations');
  };

  api.searchRecipients = function (query?: string, filters?: Record<string, any>) {
    const params: Record<string, any> = {};
    if (query) params.q = query;
    if (filters) {
      if (filters.type) params.type = filters.type;
      if (filters.city) params.city = filters.city;
      if (filters.minRating) params.minRating = filters.minRating;
      if (filters.limit) params.limit = filters.limit;
    }
    return this.get('/messages/search-recipients', { params });
  };
  api.getMessageReactions = function (messageId: string) {
    return this.get('/messages/' + messageId + '/reactions');
  };
  api.addMessageReaction = function (messageId: string, data: { emoji: string }) {
    return this.post('/messages/' + messageId + '/reactions', data);
  };
  api.removeMessageReaction = function (messageId: string, emoji: string) {
    return this.delete('/messages/' + messageId + '/reactions/' + encodeURIComponent(emoji));
  };
}
