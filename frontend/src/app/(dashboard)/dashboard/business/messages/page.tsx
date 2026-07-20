'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Search, Building2, Send, ChevronLeft, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatInput, TypingIndicator, MessageBubble } from '@/components/chat';
import { connectSocket, getSocket } from '@/services/socket';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/apiClient';
import { EmptyState } from '@/components/dashboard/EmptyState';

const convItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "À l'instant";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export default function BusinessMessagesPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = user;

  // Socket init
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) connectSocket(token);
  }, []);

  // ─── Conversations business ───
  const {
    data: convsData,
    isLoading: convsLoading,
    error: convsError,
    refetch: refetchConvs,
  } = useQuery({
    queryKey: ['business-conversations'],
    queryFn: async () => {
      const res = await apiClient.getBusinessConversations();
      return res.data?.data?.conversations || [];
    },
    enabled: !!user,
    retry: 1,
    staleTime: 10000,
  });
  const conversations: any[] = Array.isArray(convsData) ? convsData : [];

  // ─── Messages de la conversation sélectionnée ───
  const { data: msgsData, isLoading: msgsLoading } = useQuery({
    queryKey: ['business-conversation', selectedConv?.id],
    queryFn: async () => {
      if (!selectedConv?.id) return [];
      const res = await apiClient.get(`/messages/conversations/${selectedConv.id}`);
      return res.data?.data?.messages || [];
    },
    enabled: !!selectedConv?.id,
    retry: 1,
  });
  const serverMessages: any[] = Array.isArray(msgsData) ? msgsData : [];

  // Fusion des messages serveur + live
  const allMessages = [...serverMessages, ...liveMessages].filter(
    (msg, i, arr) => arr.findIndex((m) => m.id === msg.id) === i
  );

  // ─── Mutation envoi message ───
  const sendMsg = useMutation({
    mutationFn: async (payload: {
      conversationId: string;
      content: string;
      attachment?: string;
      attachmentType?: string;
    }) => {
      const res = await apiClient.post(`/messages/conversations/${payload.conversationId}`, {
        content: payload.content,
        attachment: payload.attachment,
        attachmentType: payload.attachmentType,
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      setMessageText('');
      qc.invalidateQueries({ queryKey: ['business-conversations'] });
      qc.invalidateQueries({ queryKey: ['business-conversation', variables.conversationId] });
    },
  });

  // ─── Socket live updates ───
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedConv?.id) return;
    socket.emit('join:conversation', selectedConv.id);
    setLiveMessages([]);

    const handleNewMsg = (msg: any) => {
      if (msg.conversationId === selectedConv.id) {
        setLiveMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      refetchConvs();
    };

    socket.on('message:new', handleNewMsg);
    socket.on('message:sent', handleNewMsg);

    return () => {
      socket.off('message:new', handleNewMsg);
      socket.off('message:sent', handleNewMsg);
      socket.emit('leave:conversation', selectedConv.id);
    };
  }, [selectedConv?.id, refetchConvs]);

  // ─── Typing socket events ───
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const timeouts = new Map<string, NodeJS.Timeout>();

    const handleStart = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === selectedConv?.id && data.userId !== currentUser?.id) {
        setTypingUsers((prev) => ({ ...prev, [data.userId]: 'Client' }));
        if (timeouts.has(data.userId)) clearTimeout(timeouts.get(data.userId)!);
        timeouts.set(
          data.userId,
          setTimeout(() => {
            setTypingUsers((prev) => {
              const n = { ...prev };
              delete n[data.userId];
              return n;
            });
            timeouts.delete(data.userId);
          }, 5000)
        );
      }
    };
    const handleStop = (data: { conversationId: string; userId: string }) => {
      setTypingUsers((prev) => {
        const n = { ...prev };
        delete n[data.userId];
        return n;
      });
      if (timeouts.has(data.userId)) {
        clearTimeout(timeouts.get(data.userId)!);
        timeouts.delete(data.userId);
      }
    };
    socket.on('typing:start', handleStart);
    socket.on('typing:stop', handleStop);
    return () => {
      socket.off('typing:start', handleStart);
      socket.off('typing:stop', handleStop);
      timeouts.forEach((t) => clearTimeout(t));
      timeouts.clear();
    };
  }, [selectedConv?.id, currentUser?.id]);

  useEffect(() => {
    setLiveMessages([]);
    setTypingUsers({});
  }, [selectedConv?.id]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  const filtered = conversations.filter(
    (c: any) => !search || c.businessName?.toLowerCase().includes(search.toLowerCase())
  );

  const typingUser = selectedConv?.id
    ? (Object.values(typingUsers)[0] as string | undefined)
    : undefined;

  const handleSend = (attachment?: { url: string; type: string }) => {
    if ((!messageText.trim() && !attachment) || !selectedConv) return;
    sendMsg.mutate({
      conversationId: selectedConv.id,
      content: messageText.trim() || (attachment ? '[Pièce jointe]' : ''),
      ...(attachment ? { attachment: attachment.url, attachmentType: attachment.type } : {}),
    });
  };

  if (convsError) return <ErrorState message={convsError.message} onRetry={refetchConvs} />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Messagerie Business"
        description="Répondez aux messages de vos clients"
        breadcrumbs={[{ label: 'Business' }, { label: 'Messagerie' }]}
      />

      <div className="h-[calc(100vh-16rem)] -mx-6 flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 relative">
        {/* ─── Conversation list ─── */}
        <div
          className={cn(
            'w-80 lg:w-96 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 flex flex-col',
            'absolute lg:relative inset-0 z-10 lg:z-auto',
            !showMobileList && 'hidden lg:flex'
          )}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              Conversations clients
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader variant="spinner" size="md" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<MessageCircle className="h-10 w-10" />}
                title="Aucun message client"
                description="Quand des clients vous écriront, leurs messages apparaîtront ici."
              />
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
                className="divide-y divide-gray-50 dark:divide-gray-700/30"
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map((conv: any) => (
                    <motion.div key={conv.id} variants={convItemVariants} layout>
                      <button
                        onClick={() => {
                          setSelectedConv(conv);
                          setShowMobileList(false);
                        }}
                        type="button"
                        className={cn(
                          'w-full flex items-center gap-3 p-4 text-left transition-all relative overflow-hidden',
                          'hover:bg-gray-50 dark:hover:bg-gray-700/30',
                          selectedConv?.id === conv.id ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center text-white font-bold shrink-0 relative">
                          {conv.businessName?.charAt(0) || <Building2 className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {conv.businessName || 'Client'}
                            </p>
                            <span className="text-[10px] text-gray-400 shrink-0 ml-2 whitespace-nowrap">
                              {formatTime(conv.lastMessageAt)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {conv.lastMessage || 'Nouvelle conversation'}
                          </p>
                        </div>
                        {(conv.unreadCount ?? 0) > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm shadow-brand/30"
                          >
                            {conv.unreadCount || conv.unread || 0}
                          </motion.div>
                        )}
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          <button
            onClick={() => refetchConvs()}
            type="button"
            className="flex items-center justify-center gap-2 p-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-t border-gray-200 dark:border-gray-700"
          >
            <RefreshCw className="h-3 w-3" />
            Actualiser
          </button>
        </div>

        {/* ─── Chat area ─── */}
        <div
          className={cn(
            'flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50',
            !selectedConv && 'items-center justify-center'
          )}
        >
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedConv(null);
                      setShowMobileList(true);
                    }}
                    type="button"
                    className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center text-white font-bold">
                    {selectedConv.businessName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {selectedConv.businessName || 'Client'}
                    </p>
                    <p className="text-xs text-gray-400">Client AfriBiz</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader variant="spinner" size="sm" />
                  </div>
                ) : allMessages.length === 0 && !typingUser ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center text-center py-16"
                  >
                    <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-4">
                      <Send className="h-6 w-6 text-brand/40" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Aucun message dans cette conversation
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Répondez au message ci-dessous
                    </p>
                  </motion.div>
                ) : (
                  <AnimatePresence initial={false}>
                    {allMessages.map((msg: any) => (
                      <motion.div
                        key={msg.id || Math.random()}
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <MessageBubble
                          message={{
                            id: msg.id,
                            content: msg.content,
                            senderId: msg.senderId,
                            attachment: msg.attachment,
                            attachmentType: msg.attachmentType,
                            createdAt: msg.createdAt,
                            read: msg.read,
                            readAt: msg.readAt,
                          }}
                          currentUserId={currentUser?.id || ''}
                          isOutgoing={msg.senderId === currentUser?.id}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <AnimatePresence>
                  {typingUser && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <TypingIndicator name={typingUser} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input avec le composant ChatInput complet */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <ChatInput
                  conversationId={selectedConv?.id || null}
                  value={messageText}
                  onChange={setMessageText}
                  onSend={handleSend}
                  isLoading={sendMsg.isPending}
                  placeholder="Écrivez votre réponse..."
                />
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex items-center justify-center p-8"
            >
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-900/20 dark:to-emerald-900/20 flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <MessageCircle className="h-10 w-10 text-brand/40 dark:text-brand-400/40" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Messagerie Business
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Sélectionnez une conversation client pour y répondre.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
