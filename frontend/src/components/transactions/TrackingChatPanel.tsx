'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  useMessages,
  useSendMessage,
  useCreateConversation,
  useConversations,
} from '@/features/hooks/messages';
import { useConversationSocket } from '@/features/chat/useConversationSocket';
import { cn } from '@/lib/utils';

interface TrackingChatPanelProps {
  businessId: string;
  businessName: string;
  transactionType: string;
  transactionNumber: string;
  onClose: () => void;
}

export function TrackingChatPanel({
  businessId,
  businessName,
  transactionType,
  transactionNumber,
  onClose,
}: TrackingChatPanelProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversations, isLoading: conversationsLoading } = useConversations('business');
  const { data: messagesData, isLoading: messagesLoading } = useMessages(conversationId || '');
  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();

  // Find or create conversation linked to this business
  useEffect(() => {
    if (conversationsLoading || !conversations) return;

    const existing = conversations.find(
      (c: any) => c.recipientId === businessId || c.businessId === businessId
    );
    if (existing) {
      setConversationId(existing.id);
    }
  }, [conversations, conversationsLoading, businessId]);

  useConversationSocket({ conversationId });

  const messages = messagesData?.messages || messagesData || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return;

    const content = inputValue.trim();
    setInputValue('');

    if (conversationId) {
      sendMessage.mutate({
        conversationId,
        content,
      });
    } else {
      createConversation.mutate(
        {
          recipientId: businessId,
          subject: `${transactionType} ${transactionNumber}`,
          initialMessage: content,
        },
        {
          onSuccess: (data: any) => {
            const newId = data?.id || data?.conversationId;
            if (newId) setConversationId(newId);
          },
        }
      );
    }
  }, [
    inputValue,
    conversationId,
    businessId,
    transactionType,
    transactionNumber,
    sendMessage,
    createConversation,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 w-full sm:w-[440px] sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {businessName}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {transactionType} · {transactionNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {messagesLoading || conversationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Commencez la conversation avec {businessName}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Concernant votre {transactionType.toLowerCase()} {transactionNumber}
              </p>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isOwn = msg.senderId !== businessId;
              return (
                <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                      isOwn
                        ? 'bg-brand text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={cn(
                        'text-[10px] mt-1',
                        isOwn ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'
                      )}
                    >
                      {formatDate(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Votre message..."
              className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:text-gray-100 max-h-24"
              rows={1}
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!inputValue.trim() || sendMessage.isPending || createConversation.isPending}
              className="rounded-xl px-3 py-2.5"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
