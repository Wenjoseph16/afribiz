'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  X, Play, Pause, Heart, MessageCircle, ShoppingBag, 
  Users, Send, Eye, ChevronLeft, ChevronRight,
  Shield, ExternalLink, ThumbsUp, Sparkles, Loader2, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { io, Socket } from 'socket.io-client';
import { useMediaAddToCart, useMediaCreateOrder } from '@/hooks/features/useMediaCommerce';

export interface LivePlayerProps {
  live: any;
  onClose?: () => void;
  compact?: boolean;
}

const EMOJI_REACTIONS = ['❤️', '🔥', '👏', '🎉', '💯', '😍'];

export function LivePlayer({ live, onClose, compact }: LivePlayerProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'products'>('chat');
  const [chatMessages, setChatMessages] = useState<any[]>(live?.chats || []);
  const [messageInput, setMessageInput] = useState('');
  const [viewerCount, setViewerCount] = useState(live?.viewerCount || 0);
  const [reactions, setReactions] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentProductIdx, setCurrentProductIdx] = useState(0);
  const [buyingProduct, setBuyingProduct] = useState<string | null>(null);
  const [boughtProduct, setBoughtProduct] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const addToCart = useMediaAddToCart();
  const createOrder = useMediaCreateOrder();

  // Connecter socket
  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    const s = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('live:join', live.id);
    });

    s.on('live:chat-message', (msg: any) => {
      setChatMessages(prev => [msg, ...prev].slice(0, 100));
    });

    s.on('live:reaction', (r: any) => {
      setReactions(prev => [...prev, r].slice(-20));
      setTimeout(() => setReactions(prev => prev.slice(1)), 2000);
    });

    s.on('live:viewer-count-update', (data: any) => {
      setViewerCount(data.count);
    });

    return () => {
      s.emit('live:leave', live.id);
      s.disconnect();
    };
  }, [live.id]);

  // Scroll to bottom when new chat messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = useCallback(() => {
    if (!messageInput.trim() || !socketRef.current) return;
    socketRef.current.emit('live:chat', {
      liveId: live.id,
      message: messageInput.trim(),
      userName: 'Moi',
    });
    setMessageInput('');
  }, [messageInput, live.id]);

  const sendReaction = useCallback((emoji: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('live:reaction', { liveId: live.id, emoji });
  }, [live.id]);

  const products = live?.products || [];

  return (
    <div className={cn('flex flex-col lg:flex-row gap-4', compact ? '' : 'min-h-[80vh]')}>
      {/* Main player */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Video zone */}
        <div className={cn(
          'relative bg-black rounded-2xl overflow-hidden',
          compact ? 'aspect-video' : 'aspect-video lg:aspect-[16/9]'
        )}>
          {live.streamUrl ? (
            <iframe
              src={live.streamUrl}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-brand-900/20 to-gray-900">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-brand-500/20 flex items-center justify-center mb-4">
                  <Play className="w-10 h-10 text-brand-400" />
                </div>
                <p className="text-white/80 text-lg font-medium">{live.title}</p>
                {live.status === 'LIVE' && (
                  <span className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    EN DIRECT
                  </span>
                )}
                {live.status === 'SCHEDULED' && live.scheduledAt && (
                  <p className="text-white/60 text-sm mt-2">
                    Planifié le {new Date(live.scheduledAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Overlay — neon glow effects */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              {live.status === 'LIVE' ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 backdrop-blur-md border border-red-400/30 shadow-lg shadow-red-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-red-300 text-xs font-bold uppercase tracking-wider drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">EN DIRECT</span>
                </div>
              ) : live.status === 'SCHEDULED' ? (
                <div className="px-3 py-1.5 rounded-full bg-amber-500/15 backdrop-blur-md border border-amber-400/20">
                  <span className="text-amber-300 text-xs font-medium">Planifié</span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-full bg-gray-500/15 backdrop-blur-md border border-gray-400/20">
                  <span className="text-gray-400 text-xs font-medium">Terminé</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                <Users className="w-3 h-3 text-white/80" />
                <span className="text-white text-xs font-medium">{viewerCount}</span>
              </div>
              {live.hasEscrow && (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-500/20 backdrop-blur-md border border-brand-400/30 shadow-sm">
                  <Shield className="w-3 h-3 text-brand-300" />
                  <span className="text-brand-300 text-xs font-medium">Escrow</span>
                </div>
              )}
            </div>
            {onClose && (
              <button onClick={onClose} className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live info */}
        <div className="flex items-center gap-3">
          <Link href={'/business/' + live.business?.slug} className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {live.business?.logo ? (
                <Image src={live.business.logo} alt={live.business.name} width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">
                  {live.business?.name?.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {live.business?.name}
              </p>
              {live.business?.city && (
                <p className="text-xs text-gray-400">{live.business.city}</p>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => sendReaction('❤️')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Heart className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" />
            </button>
            <button onClick={() => setActiveTab('chat')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden">
              <MessageCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Description */}
        {live.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{live.description}</p>
        )}

        {/* Products carousel (mobile) — glass cards */}
        {products.length > 0 && (
          <div className="lg:hidden">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-100 dark:bg-brand-900/30">
                <ShoppingBag className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>
              Produits ({products.length})
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
              {products.map((p: any, idx: number) => (
                <div key={p.id} className="flex-shrink-0 w-44 snap-start group cursor-pointer">
                  <div className="rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                          <ShoppingBag className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        </div>
                      )}
                      {p.remainingStock === 0 && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-white text-xs font-medium px-3 py-1 rounded-full bg-white/10 border border-white/20">Rupture</span>
                        </div>
                      )}
                      {p.remainingStock > 0 && p.remainingStock <= 5 && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-red-500/80 backdrop-blur-sm text-white text-[10px] font-medium">
                          Plus que {p.remainingStock} !
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{p.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-sm font-bold bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-400 dark:to-brand-300 bg-clip-text text-transparent">
                          {Number(p.price).toLocaleString()} FCFA
                        </p>
                        {p.remainingStock > 0 && (
                          <span className="text-[10px] text-gray-400">{p.remainingStock} restants</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar (Chat + Products) */}
      <div className={cn('w-full lg:w-80 flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden', compact ? 'h-96' : 'h-[600px]')}>
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn('flex-1 py-3 text-sm font-medium transition-colors', activeTab === 'chat' ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}
          >
            <MessageCircle className="w-4 h-4 inline mr-1" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={cn('flex-1 py-3 text-sm font-medium transition-colors', activeTab === 'products' ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}
          >
            <ShoppingBag className="w-4 h-4 inline mr-1" />
            Produits ({products.length})
          </button>
        </div>

        {activeTab === 'chat' ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Soyez le premier à commenter !
                </div>
              )}
              {chatMessages.map((msg: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">
                      {msg.userName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{msg.userName}</span>
                      <span className="text-[10px] text-gray-400">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{msg.message}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Reactions floating */}
            <div className="absolute bottom-20 left-4 space-y-1 pointer-events-none">
              {reactions.map((r: any, idx: number) => (
                <div key={idx} className="text-2xl animate-bounce" style={{ animationDelay: `${idx * 0.1}s` }}>
                  {r.emoji}
                </div>
              ))}
            </div>

            {/* Emoji quick reactions — floating bar */}
            <div className="flex justify-center gap-2 px-3 py-2.5 border-t border-gray-100/50 dark:border-gray-700/30 bg-gradient-to-r from-transparent via-gray-50/50 dark:via-gray-800/50 to-transparent">
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="w-9 h-9 flex items-center justify-center text-lg rounded-full bg-white/80 dark:bg-gray-700/80 shadow-sm hover:shadow-md hover:scale-125 active:scale-90 transition-all duration-150 border border-gray-100 dark:border-gray-600"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 p-3 border-t border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Votre message..."
                className="flex-1 px-3 py-2 text-sm rounded-xl bg-gray-100 dark:bg-gray-700 border-0 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="p-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          /* Products tab */
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {products.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Aucun produit pour ce live
              </div>
            ) : products.map((p: any) => (
              <div key={p.id} className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 relative">
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                  {p.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{p.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                      {Number(p.price).toLocaleString()} FCFA
                    </span>
                    {p.remainingStock > 0 && p.remainingStock <= 5 && (
                      <span className="text-[10px] text-red-500 font-medium">
                        Plus que {p.remainingStock} !
                      </span>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (!live?.business?.id) return;
                      setBuyingProduct(p.id);
                      setBoughtProduct(null);
                      try {
                        await createOrder.mutateAsync({
                          productId: p.productId || p.id,
                          businessId: live.business.id
                        });
                        setBoughtProduct(p.id);
                        setTimeout(() => setBoughtProduct(null), 2000);
                      } catch (err) {
                        console.error('Échec achat live:', err);
                      } finally {
                        setBuyingProduct(null);
                      }
                    }}
                    disabled={buyingProduct === p.id || boughtProduct === p.id}
                    className="mt-2 w-full py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 transition-all disabled:opacity-70 active:scale-95"
                  >
                    {buyingProduct === p.id ? (
                      <Loader2 className="w-3 h-3 mx-auto animate-spin" />
                    ) : boughtProduct === p.id ? (
                      <span className="flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Acheté !</span>
                    ) : (
                      'Acheter'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
