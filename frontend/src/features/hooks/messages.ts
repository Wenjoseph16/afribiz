import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const messageKeys = {
  conversations: ['messages', 'conversations'] as const,
  conversation: (id: string) => ['messages', 'conversation', id] as const,
};

export function useConversations(type?: 'business' | 'support') {
  return useQuery({
    queryKey: [...messageKeys.conversations, type],
    queryFn: async () => {
      const res = await apiClient.getConversationsByType(type);
      return res.data.data;
    },
  });
}

export function useMessages(conversationId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...messageKeys.conversation(conversationId), params],
    queryFn: async () => {
      const res = await apiClient.getMessages(conversationId, params);
      return res.data.data;
    },
    enabled: !!conversationId,
  });
}

export type MessageProduct = {
  id: string;
  name: string;
  price?: string | number;
  image?: string | null;
  slug?: string;
  businessId?: string;
};

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      conversationId: string;
      content: string;
      attachment?: string;
      attachmentType?: string;
      product?: MessageProduct;
    }) => apiClient.sendMessageDirect(payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: messageKeys.conversations });
      qc.invalidateQueries({ queryKey: messageKeys.conversation(variables.conversationId) });
    },
  });
}

export function useCreateSupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { subject: string; description: string }) =>
      apiClient.createSupportTicket(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: messageKeys.conversations }),
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      recipientId: string;
      subject?: string;
      initialMessage?: string;
      product?: MessageProduct;
    }) => apiClient.createConversation(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: messageKeys.conversations }),
  });
}
