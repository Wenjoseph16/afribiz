'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Search, Shield, Plus, X, ArrowRight, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useCreateConversation,
} from '@/features/hooks';
import { ChatInput, TypingIndicator, MessageBubble } from '@/components/chat';
import { useConversationSocket } from '@/features/chat/useConversationSocket';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import { apiClient } from '@/services/apiClient';

export default function AdminMessagesPage() {
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showNewConv, setShowNewConv] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientResults, setRecipientResults] = useState<any[]>([]);
  const [searchingRecipients, setSearchingRecipients] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const [messagesPage, setMessagesPage] = useState(1);
  const [accMessages, setAccMessages] = useState<any[]>([]);
  const loadedPagesRef = useRef<Set<number>>(new Set());

  const { data: conversationsData, isLoading, refetch } = useConversations();
  const { data: conversationDetail } = useMessages(selectedConv?.id, {
    page: messagesPage,
    limit: 50,
  });
  const currentUser = useAuthStore((s) => s.user);
  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  useConversationSocket({
    conversationId: selectedConv?.id,
    onTypingStart: (userId, name) => {
      setTypingUsers((prev) => ({ ...prev, [userId]: name }));
    },
    onTypingStop: (userId) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    },
  });

  const searchRecipients = (q: string) => {
    if (!q.trim() || q.length < 2) {
      setRecipientResults([]);
      return;
    }
    setSearchingRecipients(true);
    apiClient
      .get('/messages/search-recipients', { params: { q } })
      .then((res) => setRecipientResults(res.data?.data?.results || []))
      .catch(() => setRecipientResults([]))
      .finally(() => setSearchingRecipients(false));
  };

  const handleRecipientInput = (value: string) => {
    setRecipientQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchRecipients(value), 300);
  };

  const startConversation = (recipient: any) => {
    const ownerId = recipient.ownerId || recipient.owner?.id;
    if (!ownerId) return;
    createConversation.mutate(
      {
        recipientId: ownerId,
        initialMessage: `Bonjour ${recipient.owner?.firstName || ''}, je vous contacte depuis l'administration AfriBiz.`,
      },
      {
        onSuccess: (data: any) => {
          setShowNewConv(false);
          setRecipientQuery('');
          setRecipientResults([]);
          refetch();
          const conv = data?.data?.data?.conversation || data?.data?.conversation;
          if (conv) setSelectedConv(conv);
        },
      }
    );
  };

  const conversations = conversationsData?.conversations || [];
  const messages = accMessages.length > 0 ? accMessages : conversationDetail?.messages || [];
  const hasMoreMessages = conversationDetail?.hasMore ?? false;

  // Accumulate messages across pages (évite les doublons sur refetch React Query)
  useEffect(() => {
    if (!conversationDetail?.messages) return;
    if (loadedPagesRef.current.has(messagesPage)) return;
    loadedPagesRef.current.add(messagesPage);

    const newMsgs = conversationDetail.messages;
    if (messagesPage === 1) {
      setAccMessages(newMsgs);
    } else {
      setAccMessages((prev) => [...newMsgs, ...prev]);
    }
  }, [conversationDetail?.messages]);

  // Reset pagination on conversation change
  useEffect(() => {
    setMessagesPage(1);
    setAccMessages([]);
    loadedPagesRef.current = new Set();
  }, [selectedConv?.id]);

  const filteredConvs = conversations.filter(
    (c: any) => !search || c.businessName?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasTyping = selectedConv?.id && typingUsers[Object.keys(typingUsers)[0]];

  const handleSend = (attachment?: { url: string; type: string }) => {
    if ((!messageText.trim() && !attachment) || !selectedConv) return;
    const payload: any = {
      conversationId: selectedConv.id,
      content: messageText.trim() || (attachment ? '[Pièce jointe]' : ''),
    };
    if (attachment) {
      payload.attachment = attachment.url;
      payload.attachmentType = attachment.type;
    }
    sendMessage.mutate(payload, { onSuccess: () => setMessageText('') });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Messagerie administration"
        description="Communications avec les utilisateurs, business et développeurs"
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Messages' }]}
      />

      <div className="h-[calc(100vh-16rem)] -mx-6 flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
        {/* Conversation list */}
        <div className="w-80 lg:w-96 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Conversations</h2>
              <button
                onClick={() => setShowNewConv(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nouveau
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <Loader variant="spinner" size="md" fullScreen />
            ) : filteredConvs.length === 0 ? (
              <EmptyState
                icon={<MessageCircle className="h-10 w-10" />}
                title="Aucune conversation"
                description="Communiquez avec les utilisateurs de la plateforme."
              />
            ) : (
              filteredConvs.map((conv: any) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 text-left transition-colors border-b border-gray-50 dark:border-gray-700/50',
                    selectedConv?.id === conv.id
                      ? 'bg-brand-50 dark:bg-brand-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center text-white font-bold shrink-0">
                    {conv.businessName?.charAt(0) || <Shield className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {conv.businessName || 'Utilisateur'}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {conv.lastMessageAt
                          ? new Date(conv.lastMessageAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {conv.lastMessage || 'Nouvelle conversation'}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50">
          {selectedConv ? (
            <>
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center text-white font-bold">
                    {selectedConv.businessName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {selectedConv.businessName || 'Utilisateur'}
                    </p>
                    <p className="text-xs text-gray-400">En ligne</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && !hasTyping ? (
                  <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-12">
                    Aucun message dans cette conversation
                  </div>
                ) : (
                  <>
                    {hasMoreMessages && (
                      <div className="text-center py-2">
                        <button
                          onClick={() => setMessagesPage((p) => p + 1)}
                          className="text-xs text-brand hover:text-brand-700 font-medium hover:underline transition-colors"
                        >
                          Charger plus de messages
                        </button>
                      </div>
                    )}
                    {messages.map((msg: any, i: number) => {
                      const isMe = msg.senderId === currentUser?.id;
                      return (
                        <MessageBubble
                          key={msg.id || i}
                          message={{
                            id: msg.id || i,
                            content: msg.content,
                            senderId: msg.senderId,
                            attachment: msg.attachment,
                            attachmentType: msg.attachmentType,
                            createdAt: msg.createdAt,
                            read: msg.read,
                          }}
                          currentUserId={currentUser?.id || ''}
                          isOutgoing={isMe}
                        />
                      );
                    })}
                    <AnimatePresence>{hasTyping && <TypingIndicator />}</AnimatePresence>
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <ChatInput
                  conversationId={selectedConv?.id || null}
                  value={messageText}
                  onChange={setMessageText}
                  onSend={handleSend}
                  isLoading={sendMessage.isPending}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Shield className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 dark:text-gray-500">
                  Sélectionnez une conversation
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
                  Gérez les communications avec les utilisateurs
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      <AnimatePresence>
        {showNewConv && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowNewConv(false);
              setRecipientQuery('');
              setRecipientResults([]);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e: any) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Nouveau message
                </h3>
                <button
                  onClick={() => {
                    setShowNewConv(false);
                    setRecipientQuery('');
                    setRecipientResults([]);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Rechercher un utilisateur ou business
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nom..."
                    value={recipientQuery}
                    onChange={(e) => handleRecipientInput(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="mt-4 max-h-64 overflow-y-auto space-y-1">
                  {searchingRecipients ? (
                    <div className="text-center py-8 text-sm text-gray-400">Recherche...</div>
                  ) : recipientQuery.length < 2 ? (
                    <div className="text-center py-8 text-sm text-gray-400">
                      Saisissez au moins 2 caractères
                    </div>
                  ) : recipientResults.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400">Aucun résultat</div>
                  ) : (
                    recipientResults.map((r: any) => (
                      <button
                        key={r.id}
                        onClick={() => startConversation(r)}
                        disabled={createConversation.isPending}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center text-white font-bold shrink-0 relative">
                          {r.logo ? (
                            <Image
                              src={r.logo}
                              alt=""
                              fill
                              className="rounded-full object-cover"
                              sizes="40px"
                            />
                          ) : (
                            r.name?.charAt(0) || <Building2 className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {r.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{r.city || 'Business'}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-brand shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
