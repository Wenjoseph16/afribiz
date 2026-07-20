import type { ApiClientMethods } from './api-client.types';

export function injectMessages(api: ApiClientMethods) {
  api.getConversations = function () {
    return this.get('/messages/conversations');
  };
  api.getMessages = function (conversationId: string, params?: { page?: number; limit?: number }) {
    return this.get(`/messages/conversations/${conversationId}`, { params });
  };
  api.sendMessage = function (data: {
    conversationId?: string;
    recipientId?: string;
    content: string;
    attachment?: string;
    attachmentType?: string;
  }) {
    return this.post('/messages', data);
  };
  api.createConversation = function (data: {
    recipientId: string;
    subject?: string;
    initialMessage?: string;
  }) {
    return this.post('/messages/conversations', data);
  };
}
