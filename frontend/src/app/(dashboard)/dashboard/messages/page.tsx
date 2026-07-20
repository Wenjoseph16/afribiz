'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MessageCircle,
  Search,
  MoreVertical,
  Phone,
  Video,
  Building2,
  Plus,
  X,
  ArrowRight,
  Send,
  Clock,
  ChevronLeft,
  Star,
  MapPin,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
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
import { connectSocket, getSocket, disconnectSocket } from '@/services/socket';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import { apiClient } from '@/services/apiClient';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const convItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showNewConv, setShowNewConv] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientResults, setRecipientResults] = useState<any[]>([]);
  const [searchingRecipients, setSearchingRecipients] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const [activeFilters, setActiveFilters] = useState<{
    type?: string;
    city?: string;
    minRating?: number;
  }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const [socketReady, setSocketReady] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const liveConvRef = useRef<string | null>(null);

  const { user } = useAuthStore();
  const currentUser = user;

  const { data: conversationsData, isLoading, error, refetch } = useConversations();
  const { data: conversationDetail, isLoading: msgsLoading } = useMessages(selectedConv?.id, {
    limit: 100,
  });
  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();

  // ─── Socket initialization ───
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const sock = connectSocket(token);
      if (sock.connected) {
        setSocketReady(true);
      }
      sock.on('connect', () => setSocketReady(true));
      sock.on('disconnect', () => setSocketReady(false));
    } catch {
      // Socket non disponible, fonctionne sans
    }

    return () => {
      // Ne pas déconnecter le socket au démontage du composant
    };
  }, []);

  // ─── Live messages via socket ───
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedConv?.id) return;

    // Rejoindre la room de la conversation
    socket.emit('join:conversation', selectedConv.id);
    liveConvRef.current = selectedConv.id;

    const handleNewMsg = (msg: any) => {
      if (msg.conversationId === selectedConv.id) {
        setLiveMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Scroll en bas
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      // Rafraîchir la liste des conversations
      refetch();
    };

    const handleMsgSent = (msg: any) => {
      if (msg.conversationId === selectedConv.id) {
        setLiveMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      refetch();
    };

    socket.on('message:new', handleNewMsg);
    socket.on('message:sent', handleMsgSent);

    return () => {
      socket.off('message:new', handleNewMsg);
      socket.off('message:sent', handleMsgSent);
      socket.emit('leave:conversation', selectedConv.id);
    };
  }, [selectedConv?.id, refetch]);

  // ─── Typing socket events ───
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const typingTimeouts = new Map<string, NodeJS.Timeout>();

    const handleTypingStart = (data: {
      conversationId: string;
      userId: string;
      userName?: string;
    }) => {
      if (data.conversationId === selectedConv?.id && data.userId !== currentUser?.id) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: data.userName || "Quelqu'un",
        }));
        if (typingTimeouts.has(data.userId)) clearTimeout(typingTimeouts.get(data.userId)!);
        typingTimeouts.set(
          data.userId,
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = { ...prev };
              delete next[data.userId];
              return next;
            });
            typingTimeouts.delete(data.userId);
          }, 5000)
        );
      }
    };

    const handleTypingStop = (data: { conversationId: string; userId: string }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
      if (typingTimeouts.has(data.userId)) {
        clearTimeout(typingTimeouts.get(data.userId)!);
        typingTimeouts.delete(data.userId);
      }
    };

    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      typingTimeouts.forEach((t) => clearTimeout(t));
      typingTimeouts.clear();
    };
  }, [selectedConv?.id, currentUser?.id]);

  // ─── Reset live messages on conversation change ───
  useEffect(() => {
    setLiveMessages([]);
    setTypingUsers({});
  }, [selectedConv?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages, conversationDetail?.messages]);

  // ─── Auto-conversation from URL params ───
  // Supports: ?business=SLUG&businessName=NAME  (depuis marketplace)
  //           ?userId=ID                        (depuis commandes, contacts)
  const autoCreateRef = useRef(false);
  useEffect(() => {
    if (autoCreateRef.current) return;

    const userId = searchParams.get('userId');
    const businessSlug = searchParams.get('business');
    const businessName = searchParams.get('businessName');

    if (!userId && !businessSlug) return;
    if (userId && userId === currentUser?.id) return;
    autoCreateRef.current = true;

    const autoStart = async () => {
      try {
        if (userId) {
          // Créer une conversation directe avec cet utilisateur
          createConversation.mutate(
            { recipientId: userId, initialMessage: `Bonjour, je vous contacte depuis AfriBiz.` },
            {
              onSuccess: (data: any) => {
                refetch();
                const conv = data?.data?.data?.conversation || data?.data?.conversation;
                if (conv) {
                  setSelectedConv(conv);
                  setShowMobileList(false);
                }
              },
            }
          );
        } else if (businessSlug && businessName) {
          const res = await apiClient.searchRecipients(businessName);
          const results: any[] = res.data?.data?.results || [];
          if (results.length > 0) {
            const recipient = results[0];
            const ownerId = recipient.ownerId || recipient.owner?.id;
            if (ownerId) {
              createConversation.mutate(
                {
                  recipientId: ownerId,
                  initialMessage: `Bonjour ${recipient.owner?.firstName || recipient.name || ''}, je vous contacte depuis AfriBiz.`,
                },
                {
                  onSuccess: (data: any) => {
                    refetch();
                    const conv = data?.data?.data?.conversation || data?.data?.conversation;
                    if (conv) {
                      setSelectedConv(conv);
                      setShowMobileList(false);
                    }
                  },
                }
              );
            }
          }
        }
      } catch {
        /* silent */
      }
    };
    autoStart();
  }, [searchParams, createConversation, refetch, currentUser?.id]);

  // ─── Search recipients ───
  const searchRecipients = useCallback(
    async (query: string, filters?: { type?: string; city?: string; minRating?: number }) => {
      setSearchingRecipients(true);
      try {
        const hasFilters = !!(filters?.type || filters?.city);
        const res = await apiClient.searchRecipients(query?.length >= 2 ? query : undefined, {
          ...filters,
          ...(!hasFilters ? { limit: 10 } : {}),
        });
        const data = res.data?.data?.results || [];
        setRecipientResults(data);
      } catch {
        setRecipientResults([]);
      } finally {
        setSearchingRecipients(false);
      }
    },
    []
  );

  const handleRecipientInput = (value: string) => {
    setRecipientQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchRecipients(value, activeFilters), 300);
  };

  const applyFilter = (key: string, value: string | number | undefined) => {
    const newFilters = { ...activeFilters, [key]: value || undefined } as any;
    if (!value) delete newFilters[key];
    setActiveFilters({
      type: newFilters.type,
      city: newFilters.city,
      minRating: newFilters.minRating ? Number(newFilters.minRating) : undefined,
    });
    if (recipientQuery.length >= 2 || newFilters.type || newFilters.city) {
      searchRecipients(recipientQuery, {
        type: newFilters.type,
        city: newFilters.city,
        minRating: newFilters.minRating ? Number(newFilters.minRating) : undefined,
      });
    }
  };

  const clearFilters = () => {
    setActiveFilters({});
    if (recipientQuery.length >= 2) searchRecipients(recipientQuery, {});
  };

  // Charger les suggestions au démarrage de la modale
  useEffect(() => {
    if (showNewConv) searchRecipients('', {});
  }, [showNewConv, searchRecipients]);

  // ─── Start conversation ───
  const startConversation = (recipient: any) => {
    const ownerId = recipient.ownerId || recipient.owner?.id;
    if (!ownerId) return;
    createConversation.mutate(
      {
        recipientId: ownerId,
        initialMessage: `Bonjour ${recipient.owner?.firstName || ''}, je vous contacte depuis AfriBiz.`,
      },
      {
        onSuccess: (data: any) => {
          setShowNewConv(false);
          setRecipientQuery('');
          setRecipientResults([]);
          refetch();
          const conv = data?.data?.data?.conversation || data?.data?.conversation;
          if (conv) {
            setSelectedConv(conv);
            setShowMobileList(false);
          }
        },
      }
    );
  };

  const handleSelectConv = (conv: any) => {
    setSelectedConv(conv);
    setShowMobileList(false);
  };

  const getConvName = (conv: any) => {
    return (
      conv.businessName ||
      conv.subject ||
      conv.name ||
      conv.recipientName ||
      conv.otherUserName ||
      conv.participants?.find((p: any) => p.id !== currentUser?.id)?.name ||
      'Conversation'
    );
  };

  const getConvAvatar = (conv: any) => {
    return conv.otherUserAvatar || conv.businessLogo || null;
  };

  const getConvInitial = (conv: any) => {
    return conv.otherUserInitial || getConvName(conv).charAt(0).toUpperCase() || '?';
  };

  const conversations = conversationsData?.conversations || [];
  const serverMessages = conversationDetail?.messages || [];
  // Fusionner les messages du serveur et les messages live
  const allMessages = [...serverMessages, ...liveMessages].filter(
    (msg, i, arr) => arr.findIndex((m) => m.id === msg.id) === i
  );

  const filteredConvs = conversations.filter(
    (c: any) => !search || getConvName(c).toLowerCase().includes(search.toLowerCase())
  );

  const typingUser = selectedConv?.id
    ? (Object.values(typingUsers)[0] as string | undefined)
    : undefined;

  // ─── Send message ───
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
    sendMessage.mutate(payload, {
      onSuccess: () => {
        setMessageText('');
      },
    });
  };

  // ─── Format business types ───
  const formatType = (type?: string) => {
    if (!type) return '';
    const map: Record<string, string> = {
      RESTAURANT: 'Restaurant',
      HOTEL: 'Hôtel',
      BOUTIQUE: 'Boutique',
      SERVICE: 'Service',
      COACHING: 'Coaching',
      EVENT: 'Événementiel',
      AGENCY: 'Agence',
      FREELANCE: 'Freelance',
      SHOP: 'Magasin',
    };
    return map[type] || type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ');
  };

  // ─── Format time ───
  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000)
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Messages"
        description="Échangez avec les business et le support"
        breadcrumbs={[{ label: 'Messages' }]}
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
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Conversations</h2>
              <button
                onClick={() => setShowNewConv(true)}
                type="button"
                className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouveau</span>
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <Loader variant="spinner" size="md" className="mt-20" />
            ) : filteredConvs.length === 0 ? (
              <EmptyState
                icon={<MessageCircle className="h-10 w-10" />}
                title="Aucune conversation"
                description="Échangez avec les business et le support."
                action={
                  <button
                    onClick={() => setShowNewConv(true)}
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-all hover:shadow-md hover:shadow-brand/20"
                  >
                    <Plus className="h-4 w-4" />
                    Nouvelle conversation
                  </button>
                }
              />
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="divide-y divide-gray-50 dark:divide-gray-700/30"
              >
                <AnimatePresence mode="popLayout">
                  {filteredConvs.map((conv: any) => (
                    <motion.div key={conv.id} variants={convItemVariants} layout>
                      <button
                        onClick={() => handleSelectConv(conv)}
                        type="button"
                        className={cn(
                          'w-full flex items-center gap-3 p-4 text-left transition-all relative overflow-hidden',
                          'hover:bg-gray-50 dark:hover:bg-gray-700/30',
                          selectedConv?.id === conv.id ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                        )}
                      >
                        {selectedConv?.id === conv.id && (
                          <motion.div
                            layoutId="activeConvIndicator"
                            className="absolute left-0 top-1 bottom-1 w-0.5 bg-brand rounded-full"
                          />
                        )}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center text-white font-bold shrink-0 relative overflow-hidden">
                          {getConvAvatar(conv) ? (
                            <Image
                              src={getConvAvatar(conv)}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            getConvInitial(conv) || <Building2 className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {getConvName(conv)}
                            </p>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 ml-2 whitespace-nowrap">
                              {formatTime(conv.lastMessageAt)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {conv.lastMessage || 'Nouvelle conversation'}
                          </p>
                        </div>
                        {conv.unread > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm shadow-brand/30"
                          >
                            {conv.unread}
                          </motion.div>
                        )}
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
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
              {/* Chat header */}
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
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center text-white font-bold overflow-hidden">
                    {getConvAvatar(selectedConv) ? (
                      <Image
                        src={getConvAvatar(selectedConv)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    ) : (
                      getConvInitial(selectedConv) || '?'
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {getConvName(selectedConv)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {!socketReady ? (
                        <span className="flex items-center gap-1 text-amber-500">
                          <AlertCircle className="h-3 w-3" /> Hors ligne
                        </span>
                      ) : (
                        'En ligne'
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-gray-500" />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Video className="h-4 w-4 text-gray-500" />
                  </button>
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
                      Aucun message
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Envoyez votre premier message ci-dessous
                    </p>
                  </motion.div>
                ) : (
                  <AnimatePresence initial={false}>
                    {allMessages.map((msg: any) => {
                      const isMe = msg.senderId === currentUser?.id;
                      return (
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
                            }}
                            currentUserId={currentUser?.id || ''}
                            isOutgoing={isMe}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}

                {/* Typing indicator */}
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

              {/* Input */}
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
                  Votre messagerie
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Sélectionnez une conversation ou démarrez une nouvelle discussion.
                </p>
                <button
                  onClick={() => setShowNewConv(true)}
                  type="button"
                  className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-brand hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-brand/25 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle conversation
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ─── New Conversation Modal ─── */}
      <AnimatePresence>
        {showNewConv && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => {
              setShowNewConv(false);
              setRecipientQuery('');
              setRecipientResults([]);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
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
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Rechercher un business
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nom du business, ville..."
                    value={recipientQuery}
                    onChange={(e) => handleRecipientInput(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                </div>

                {/* Filtres */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    type="button"
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      showFilters || Object.keys(activeFilters).length > 0
                        ? 'bg-brand/10 text-brand border border-brand/20'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    Filtres
                    {Object.keys(activeFilters).length > 0 && (
                      <span className="ml-1 w-4 h-4 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center">
                        {Object.keys(activeFilters).length}
                      </span>
                    )}
                  </button>
                  {activeFilters.type && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand/10 text-brand text-xs font-medium">
                      {formatType(activeFilters.type)}
                      <button
                        onClick={() => applyFilter('type', '')}
                        type="button"
                        className="ml-0.5 hover:text-brand-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {activeFilters.city && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium">
                      <MapPin className="h-3 w-3" />
                      {activeFilters.city}
                      <button
                        onClick={() => applyFilter('city', '')}
                        type="button"
                        className="ml-0.5 hover:text-blue-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {Object.keys(activeFilters).length > 0 && (
                    <button
                      onClick={clearFilters}
                      type="button"
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
                    >
                      Tout effacer
                    </button>
                  )}
                </div>

                {/* Filtres panel */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 overflow-hidden"
                    >
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
                            Type de business
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              '',
                              'RESTAURANT',
                              'HOTEL',
                              'BOUTIQUE',
                              'SERVICE',
                              'COACHING',
                              'EVENT',
                              'AGENCY',
                              'FREELANCE',
                              'SHOP',
                            ].map((t) => (
                              <button
                                key={t || 'all'}
                                onClick={() => applyFilter('type', t)}
                                type="button"
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                  activeFilters.type === t || (!activeFilters.type && !t)
                                    ? 'bg-brand text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:border-brand/30'
                                }`}
                              >
                                {t ? formatType(t) : 'Tous'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
                            Note minimum
                          </label>
                          <div className="flex gap-1.5">
                            {[0, 3, 3.5, 4, 4.5].map((r) => (
                              <button
                                key={r}
                                onClick={() => applyFilter('minRating', r === 0 ? '' : String(r))}
                                type="button"
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                  (activeFilters.minRating || 0) === r
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:border-amber-300'
                                }`}
                              >
                                {r > 0 && (
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                )}
                                {r > 0 ? `${r}+` : 'Tous'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
                            Ville
                          </label>
                          <input
                            type="text"
                            placeholder="Filtrer par ville..."
                            value={activeFilters.city || ''}
                            onChange={(e) => applyFilter('city', e.target.value)}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Results */}
                <div className="mt-4 max-h-72 overflow-y-auto space-y-1">
                  {searchingRecipients ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader variant="dots" size="sm" />
                    </div>
                  ) : recipientResults.length > 0 ? (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                      className="space-y-2"
                    >
                      {recipientResults.map((r: any) => (
                        <motion.div key={r.id} variants={convItemVariants}>
                          <button
                            onClick={() => startConversation(r)}
                            disabled={createConversation.isPending}
                            type="button"
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 disabled:opacity-50 group"
                          >
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center text-white font-bold shrink-0 relative overflow-hidden">
                              {r.logo ? (
                                <Image
                                  src={r.logo}
                                  alt=""
                                  fill
                                  className="rounded-full object-cover"
                                  sizes="44px"
                                />
                              ) : (
                                r.name?.charAt(0) || <Building2 className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {r.name}
                                </p>
                                {r.type && (
                                  <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full shrink-0">
                                    {formatType(r.type)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400 truncate flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {[r.city, r.country].filter(Boolean).join(', ') || 'Afrique'}
                                </span>
                                {r.rating > 0 && (
                                  <span className="text-xs text-amber-500 flex items-center gap-0.5 shrink-0">
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                    {r.rating.toFixed(1)}
                                    <span className="text-gray-400">({r.reviewCount || 0})</span>
                                  </span>
                                )}
                              </div>
                              {r.shortDescription && (
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                                  {r.shortDescription}
                                </p>
                              )}
                            </div>
                            <ArrowRight className="h-4 w-4 text-brand opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="text-center py-8 text-sm text-gray-400">
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
                      {recipientQuery.length >= 2 || Object.keys(activeFilters).length > 0 ? (
                        <p>Aucun business trouvé</p>
                      ) : (
                        <>
                          <p>Business populaires</p>
                          <p className="text-xs mt-1">ou tapez un nom pour chercher</p>
                        </>
                      )}
                    </div>
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
