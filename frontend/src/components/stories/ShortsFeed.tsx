'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, MessageCircle, Share2, Bookmark, 
  Play, Pause, ChevronUp, ChevronDown,
  ShoppingBag, Send, X, ExternalLink, 
  Calendar, Package, Loader2, Check, Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShorts, useLikeShort, useAddComment, useViewShort, useShareShort, useSaveShort, useShortComments } from '@/hooks/features/useShorts';
import { useMediaCommerceData, useMediaAddToCart, useMediaCreateOrder, useMediaBook, COMMERCE_ACTIONS } from '@/hooks/features/useMediaCommerce';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/apiClient';

export interface ShortsFeedProps {
  businessId?: string;
}

export function ShortsFeed({ businessId }: ShortsFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const { data: shortsData, isLoading } = useShorts({ businessId, limit: 20 });
  const likeShort = useLikeShort();
  const addComment = useAddComment();
  const viewShort = useViewShort();
  const shareShort = useShareShort();
  const saveShort = useSaveShort();
  const addToCart = useMediaAddToCart();
  const createOrder = useMediaCreateOrder();
  const bookService = useMediaBook();
  const { user } = useAuthStore();

  const shorts = shortsData?.items || [];
  const currentShort = shorts[currentIndex];

  // Commerce data for current short
  const { data: commerceData } = useMediaCommerceData('SHORT', currentShort?.id);
  const commerce = commerceData?.commerce;
  const actionConfig = commerce ? COMMERCE_ACTIONS[commerce.action] : null;
  const priceDisplay = commerce?.data?.price
    ? Number(commerce.data.price).toLocaleString('fr-FR') + ' FCFA'
    : null;

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const handleReport = async () => {
    if (!reportReason.trim() || !currentShort?.id) return;
    try {
      await apiClient.post('/admin/moderation/report', {
        contentType: 'SHORT',
        contentId: currentShort.id,
        reason: reportReason.trim(),
      });
      setReportSent(true);
      setTimeout(() => { setShowReport(false); setReportSent(false); setReportReason(''); }, 2000);
    } catch (err) {
      console.error('Erreur signalement:', err);
    }
  };

  const handleCommerceAction = async (action: string, d: any) => {
    if (!currentShort?.id) return;
    if (!user) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    setActionLoading(action);
    setActionSuccess(null);
    try {
      const { data } = d;
      switch (action) {
        case 'add_to_cart':
          await addToCart.mutateAsync({ productId: data.id, quantity: 1 });
          break;
        case 'order':
          await createOrder.mutateAsync({ productId: data.id, businessId: data.businessId });
          break;
        case 'book':
          await bookService.mutateAsync({ serviceId: data.id, businessId: data.businessId });
          break;
        case 'purchase':
          window.location.href = '/events/' + data.slug + '/' + data.id;
          return;
        case 'rent':
          window.location.href = '/business/' + data.businessId + '/rentals/' + data.id;
          return;
        case 'visit':
          window.location.href = '/business/' + data.slug;
          return;
        case 'view':
          window.location.href = '/business/' + data.businessId + '/promotions';
          return;
        case 'link':
          window.open(data.url, '_blank');
          return;
        case 'install':
          window.location.href = '/marketplace/modules/' + data.slug;
          return;
        default:
          if (currentShort?.linkUrl) window.open(currentShort.linkUrl, '_blank');
      }
      setActionSuccess(action);
      setTimeout(() => setActionSuccess(null), 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Action échouée';
      setActionError(msg);
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  // Fetch comments when panel is open
  const { data: commentsData } = useShortComments(showComments || '');
  const comments = commentsData?.items || [];

  // Signal view on current short change
  useEffect(() => {
    if (currentShort?.id) {
      viewShort.mutate(currentShort.id);
    }
  }, [currentIndex]);

  // Auto-play video
  useEffect(() => {
    if (!currentShort?.id) return;
    const vid = videoRefs.current.get(currentShort.id);
    if (vid) {
      if (isPaused) vid.pause();
      else vid.play().catch(() => {});
    }
  }, [currentIndex, isPaused]);

  const scrollToIndex = useCallback((idx: number) => {
    if (idx < 0 || idx >= shorts.length) return;
    setCurrentIndex(idx);
    setIsPaused(false);
  }, [shorts.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') scrollToIndex(currentIndex - 1);
    else if (e.key === 'ArrowDown') scrollToIndex(currentIndex + 1);
    else if (e.key === ' ') { e.preventDefault(); setIsPaused(p => !p); }
  }, [currentIndex, scrollToIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-400 gap-3">
        <Play className="w-12 h-12 opacity-50" />
        <p className="text-sm">Aucun short pour le moment</p>
      </div>
    );
  }

  const setVideoRef = (id: string) => (el: HTMLVideoElement | null) => {
    if (el) videoRefs.current.set(id, el);
    else videoRefs.current.delete(id);
  };

  const handleLike = () => {
    if (currentShort?.id) likeShort.mutate(currentShort.id);
  };

  const handleComment = () => {
    if (!commentInput.trim() || !currentShort?.id) return;
    addComment.mutate({ id: currentShort.id, content: commentInput.trim() });
    setCommentInput('');
  };

  const handleShare = () => {
    if (currentShort?.id) {
      shareShort.mutate(currentShort.id);
      navigator.clipboard?.writeText(window.location.origin + '/shorts/' + currentShort.id);
    }
  };

  const scrollToNext = () => scrollToIndex(currentIndex + 1);
  const scrollToPrev = () => scrollToIndex(currentIndex - 1);

  return (
    <div className="relative max-w-md mx-auto" ref={containerRef}>
      {/* Main video card */}
      <div className="relative aspect-[9/16] bg-black rounded-2xl overflow-hidden group">
        {/* Video */}
        <video
          ref={setVideoRef(currentShort?.id)}
          src={currentShort?.videoUrl}
          poster={currentShort?.thumbnailUrl}
          className="w-full h-full object-cover"
          loop
          playsInline
          onClick={() => setIsPaused(p => !p)}
        />

        {/* Pause overlay */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20" onClick={() => setIsPaused(false)}>
            <Play className="w-16 h-16 text-white/80" />
          </div>
        )}

        {/* Top overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <Link href={'/business/' + currentShort?.business?.slug} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20">
              {currentShort?.business?.logo ? (
                <Image src={currentShort.business.logo} alt="" width={32} height={32} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                  {currentShort?.business?.name?.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-white text-sm font-medium">{currentShort?.business?.name}</span>
          </Link>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={scrollToPrev}
          disabled={currentIndex === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white/80 hover:bg-black/60 disabled:opacity-0 transition-all"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={scrollToNext}
          disabled={currentIndex >= shorts.length - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white/80 hover:bg-black/60 disabled:opacity-0 transition-all"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        {/* Actions sidebar — iOS-style glass */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4">
          <button onClick={handleLike} className="flex flex-col items-center gap-0.5 group">
            <div className="p-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/20 group-hover:bg-white/25 group-hover:scale-110 active:scale-90 transition-all duration-200">
              <Heart className={cn('w-5 h-5 transition-transform duration-200 group-active:scale-125', currentShort?.isLiked ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]' : 'text-white')} />
            </div>
            <span className="text-white text-[11px] font-medium drop-shadow-lg">{currentShort?.likesCount || 0}</span>
          </button>

          <button onClick={() => setShowComments(showComments === currentShort?.id ? null : currentShort?.id)} className="flex flex-col items-center gap-0.5 group">
            <div className="p-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/20 group-hover:bg-white/25 group-hover:scale-110 active:scale-90 transition-all duration-200">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-[11px] font-medium drop-shadow-lg">{currentShort?.commentsCount || 0}</span>
          </button>

          <button onClick={handleShare} className="flex flex-col items-center gap-0.5 group">
            <div className="p-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/20 group-hover:bg-white/25 group-hover:scale-110 active:scale-90 transition-all duration-200">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-[11px] font-medium drop-shadow-lg">{currentShort?.sharesCount || 0}</span>
          </button>

          <button onClick={() => currentShort?.id && saveShort.mutate(currentShort.id)} className="flex flex-col items-center gap-0.5 group">
            <div className="p-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/20 group-hover:bg-white/25 group-hover:scale-110 active:scale-90 transition-all duration-200">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-[11px] font-medium drop-shadow-lg">Sauver</span>
          </button>

          <button onClick={() => setShowReport(true)} className="flex flex-col items-center gap-0.5 group">
            <div className="p-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/20 group-hover:bg-white/25 group-hover:scale-110 active:scale-90 transition-all duration-200">
              <Flag className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-[11px] font-medium drop-shadow-lg">Signaler</span>
          </button>
        </div>

        {/* Bottom info — glass overlay avec CTA commerce */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
          {currentShort?.title && (
            <h3 className="text-white font-medium text-sm drop-shadow-lg">{currentShort.title}</h3>
          )}
          {currentShort?.description && (
            <p className="text-white/70 text-xs mt-1 line-clamp-2 drop-shadow">{currentShort.description}</p>
          )}

          {/* Commerce CTA — Bouton d'action direct */}
          {commerce && actionConfig && (
            <div className="mt-2 space-y-1.5 animate-fade-in-up">
              {priceDisplay && (
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
                  {commerce.type === 'PROMOTION' ? '🔥 ' : ''}{priceDisplay}
                </div>
              )}
              <button
                onClick={() => handleCommerceAction(commerce.action, commerce)}
                disabled={actionLoading === commerce.action}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-semibold hover:from-brand-600 hover:to-brand-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-brand-500/30 disabled:opacity-70"
              >
                {actionLoading === commerce.action ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : actionSuccess === commerce.action ? (
                  <><Check className="w-3.5 h-3.5" /> ✓ Ajouté !</>
                ) : (
                  <>
                    {actionConfig.action === 'add_to_cart' ? <ShoppingBag className="w-3.5 h-3.5" /> :
                     actionConfig.action === 'order' ? <Package className="w-3.5 h-3.5" /> :
                     actionConfig.action === 'book' ? <Calendar className="w-3.5 h-3.5" /> :
                     actionConfig.action === 'install' ? <Package className="w-3.5 h-3.5" /> :
                     <ExternalLink className="w-3.5 h-3.5" />}
                    {commerce.label}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Fallback link simple */}
          {!commerce && currentShort?.linkUrl && (
            <a
              href={currentShort.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium hover:bg-white/25 hover:border-white/30 active:scale-95 transition-all duration-200 shadow-lg"
            >
              En savoir plus
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Report form — glass popup */}
      {showReport && (
        <div className="absolute top-16 right-16 z-30 w-60 p-3 rounded-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-2xl animate-fade-in">
          {reportSent ? (
            <div className="flex items-center gap-2 py-2 text-emerald-400 text-sm font-medium">
              <Check className="w-4 h-4" />
              Signalement envoyé ✓
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Signaler ce short</p>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Motif...</option>
                <option value="CONTENU_INAPPROPRIE">Contenu inapproprié</option>
                <option value="SPAM">Spam</option>
                <option value="HARCELEMENT">Harcèlement</option>
                <option value="FAUSSE_INFO">Fausse information</option>
                <option value="AUTRE">Autre</option>
              </select>
              <div className="flex gap-1.5">
                <button
                  onClick={() => { setShowReport(false); setReportReason(''); }}
                  className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReport}
                  disabled={!reportReason.trim()}
                  className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  Signaler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress dots */}
        <div className="absolute top-2 left-2 right-2 flex gap-0.5">
          {shorts.slice(0, Math.min(10, shorts.length)).map((_: any, idx: number) => (
            <div
              key={idx}
              className={cn(
                'flex-1 h-0.5 rounded-full transition-all',
                idx === currentIndex ? 'bg-white' : idx < currentIndex ? 'bg-white/50' : 'bg-white/20'
              )}
            />
          ))}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-1 mt-3">
        {shorts.slice(0, Math.min(20, shorts.length)).map((_: any, idx: number) => (
          <button
            key={idx}
            onClick={() => scrollToIndex(idx)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              idx === currentIndex ? 'bg-brand-500 w-6' : 'bg-gray-300 dark:bg-gray-600'
            )}
          />
        ))}
      </div>

      {/* Comments panel — glass morphism */}
      {showComments === currentShort?.id && (
        <div className="mt-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between p-4 border-b border-gray-100/50 dark:border-gray-700/30">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Commentaires <span className="text-gray-400 font-normal ml-1">({comments.length})</span>
            </h3>
            <button onClick={() => setShowComments(null)} className="p-1.5 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto p-4 space-y-3">
            {comments.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Aucun commentaire
              </p>
            )}
            {comments.map((c: any, idx: number) => (
              <div key={c.id || idx} className="flex gap-2.5 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-[10px] font-bold text-white">
                    {c.userName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{c.userName}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(c.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-4 border-t border-gray-100/50 dark:border-gray-700/30 bg-gray-50/30 dark:bg-gray-900/30">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              placeholder="Votre commentaire..."
              className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-gray-100/80 dark:bg-gray-700/80 border border-gray-200/50 dark:border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50 transition-all placeholder:text-gray-400"
            />
            <button
              onClick={handleComment}
              disabled={!commentInput.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all duration-200 shadow-md shadow-brand-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
