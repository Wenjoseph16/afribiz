'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play,
  Users,
  Eye,
  Send,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Loader2,
  MessageCircle,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { VideoCheckoutOverlay } from '@/components/media/VideoCheckoutOverlay';

const EMOJIS = ['❤️', '🔥', '👏', '😂', '🎉', '👍'];

export function LiveViewer({ liveId }: { liveId: string }) {
  const { user } = useAuthStore();
  const [live, setLive] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [joined, setJoined] = useState(false);
  const [checkout, setCheckout] = useState<any>(null);
  const [showChat, setShowChat] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadLive = useCallback(async () => {
    try {
      const res = await apiClient.getLive(liveId);
      setLive(res.data?.data);
    } catch {
      /* live introuvable */
    }
  }, [liveId]);

  const loadChats = useCallback(async () => {
    try {
      const res = await apiClient.getLiveChats(liveId);
      setChats(res.data?.data?.items || res.data?.data || []);
    } catch {
      /* ignore */
    }
  }, [liveId]);

  // Chargement initial + rafraîchissement
  useEffect(() => {
    loadLive();
    loadChats();
    const chatTimer = setInterval(loadChats, 5000);
    const liveTimer = setInterval(loadLive, 15000);
    return () => {
      clearInterval(chatTimer);
      clearInterval(liveTimer);
    };
  }, [loadLive, loadChats]);

  // Join / leave
  useEffect(() => {
    if (!live?.id) return;
    let active = true;
    apiClient
      .joinLiveRoom(live.id)
      .then(() => active && setJoined(true))
      .catch(() => {});
    return () => {
      active = false;
      if (live?.id) apiClient.leaveLiveRoom(live.id).catch(() => {});
    };
  }, [live?.id]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats.length]);

  if (!live) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const isLive = live.status === 'LIVE';
  const isScheduled = live.status === 'SCHEDULED';
  const products = live.products || [];
  const viewerCount = live.viewerCount || 0;

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await apiClient.sendLiveChat(live.id, message.trim());
      setMessage('');
      loadChats();
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const handleReaction = (emoji: string) => {
    apiClient.sendLiveReaction(live.id, emoji).catch(() => {});
  };

  const openProductCheckout = (p: any) => {
    if (!user) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    // Tout type d'article du catalogue peut être vendu en live (produit, service, chambre…)
    const itemType = p.itemType || 'PRODUCT';
    const itemId = p.itemId || p.productId;
    if (!itemId) return;
    setCheckout({
      type: itemType,
      data: {
        id: itemId,
        name: p.name,
        price: Number(p.price),
        images: p.image ? [p.image] : [],
        businessId: live.businessId,
        slug: itemId,
      },
      action: 'order',
      label: 'Commander',
    });
  };

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-5 max-w-7xl mx-auto">
      {/* ─── Colonne principale : vidéo + chat mobile ─── */}
      <div className="space-y-4 min-w-0">
        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden ring-1 ring-white/10">
          {live.streamUrl ? (
            <video
              src={live.streamUrl}
              className="w-full h-full object-cover"
              controls
              autoPlay
              playsInline
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {live.coverImage ? (
                <Image
                  src={live.coverImage}
                  alt={live.title}
                  fill
                  className="object-cover opacity-60"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                {isLive ? (
                  <span className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-full animate-pulse">
                    <span className="w-2.5 h-2.5 bg-white rounded-full" /> EN DIRECT
                  </span>
                ) : (
                  <span className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-full">
                    <Calendar className="w-4 h-4" /> PROGRAMMÉ
                  </span>
                )}
                {isScheduled && live.scheduledAt && (
                  <p className="text-white/80 text-sm">
                    {new Date(live.scheduledAt).toLocaleString('fr-FR', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {isLive && (
              <span className="px-2.5 py-1 bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full" /> EN DIRECT
              </span>
            )}
            {live.hasEscrow && (
              <span className="px-2 py-1 bg-emerald-600/90 text-white text-[10px] font-medium rounded-full backdrop-blur-sm flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Escrow
              </span>
            )}
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
            <Eye className="w-3 h-3" /> {viewerCount}
          </div>
        </div>

        {/* Titre + business */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {live.title}
            </h1>
            {live.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{live.description}</p>
            )}
            <Link
              href={`/business/${live.business?.slug}`}
              className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {live.business?.name?.charAt(0) || '?'}
              </div>
              {live.business?.name}
            </Link>
          </div>
        </div>

        {/* Réactions rapides */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium mr-1">Réagir :</span>
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => handleReaction(e)}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:scale-110 active:scale-90 transition-all"
            >
              {e}
            </button>
          ))}
        </div>

        {/* Chat (mobile) */}
        <div className="lg:hidden">
          <ChatPanel
            chats={chats}
            message={message}
            setMessage={setMessage}
            onSend={handleSend}
            sending={sending}
            chatEndRef={chatEndRef}
          />
        </div>
      </div>

      {/* ─── Colonne latérale : produits + chat (desktop) ─── */}
      <div className="space-y-5">
        {/* Produits du live — live shopping */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-red-500" />
              Acheter pendant le live
              <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full">
                {products.length}
              </span>
            </h3>
          </div>
          {products.length === 0 ? (
            <p className="p-4 text-xs text-gray-400 text-center">
              {isLive
                ? 'Aucun produit épinglé pour le moment'
                : 'Les produits seront annoncés au démarrage'}
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
              {products.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {p.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-brand-600 dark:text-brand-400 font-bold">
                        {Number(p.price).toLocaleString('fr-FR')} F
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-medium',
                          p.remainingStock <= 3 ? 'text-red-500' : 'text-gray-400'
                        )}
                      >
                        {p.remainingStock}/{p.stock} restants
                      </span>
                    </div>
                    {p.remainingStock <= 3 && (
                      <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full animate-pulse"
                          style={{ width: `${Math.max(5, (p.remainingStock / p.stock) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openProductCheckout(p)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-semibold hover:from-red-700 hover:to-red-600 active:scale-95 transition-all shrink-0"
                  >
                    Acheter
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat (desktop) */}
        <div className="hidden lg:block">
          <ChatPanel
            chats={chats}
            message={message}
            setMessage={setMessage}
            onSend={handleSend}
            sending={sending}
            chatEndRef={chatEndRef}
          />
        </div>
      </div>

      <VideoCheckoutOverlay
        open={!!checkout}
        onClose={() => setCheckout(null)}
        commerce={checkout}
      />
    </div>
  );
}

function ChatPanel({
  chats,
  message,
  setMessage,
  onSend,
  sending,
  chatEndRef,
}: {
  chats: any[];
  message: string;
  setMessage: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  chatEndRef: React.Ref<HTMLDivElement>;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[420px]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <MessageCircle className="w-4 h-4 text-brand-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Chat en direct</h3>
        <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
          <Users className="w-3.5 h-3.5" /> {chats.length} messages
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chats.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Soyez le premier à commenter !
          </p>
        )}
        {chats.map((c: any, idx: number) => (
          <div key={c.id || idx} className="flex gap-2.5 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-white">
                {c.userName?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {c.userName || 'Anonyme'}
                </span>
                <span className="text-[10px] text-gray-400">
                  {new Date(c.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{c.message}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex items-center gap-2 p-3 border-t border-gray-100 dark:border-gray-800">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
          placeholder="Écrire un message..."
          className="flex-1 px-3.5 py-2.5 text-sm rounded-xl bg-gray-100 dark:bg-gray-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all placeholder:text-gray-400"
        />
        <button
          onClick={onSend}
          disabled={!message.trim() || sending}
          className="p-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 disabled:opacity-40 active:scale-95 transition-all"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
