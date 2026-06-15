'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight, Play, Pause, ExternalLink, ShoppingBag, Calendar, Package, Sparkles, Loader2, Check, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewStory, useClickStory, type StoryGroup } from '@/hooks/features/useStories';
import { useMediaCommerceData, useMediaAddToCart, useMediaCreateOrder, useMediaBook, COMMERCE_ACTIONS } from '@/hooks/features/useMediaCommerce';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/apiClient';

export interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroup: StoryGroup;
  onClose: () => void;
}

export function StoryViewer({ groups, initialGroup, onClose }: StoryViewerProps) {
  const [currentGroupIdx, setCurrentGroupIdx] = useState(
    groups.findIndex(g => g.business.id === initialGroup.business.id)
  );
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressRef = useRef<number>(0);
  const animFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const viewStory = useViewStory();
  const clickStory = useClickStory();
  const addToCart = useMediaAddToCart();
  const createOrder = useMediaCreateOrder();
  const bookService = useMediaBook();
  const { user } = useAuthStore();

  const currentGroup = groups[currentGroupIdx];
  const stories = currentGroup?.stories || [];
  const currentStory = stories[currentStoryIdx];

  const { data: commerceData } = useMediaCommerceData('STORY', currentStory?.id);
  const commerce = commerceData?.commerce;

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const handleReport = async () => {
    if (!reportReason.trim() || !currentStory?.id) return;
    try {
      await apiClient.post('/admin/moderation/report', {
        contentType: 'STORY',
        contentId: currentStory.id,
        reason: reportReason.trim(),
      });
      setReportSent(true);
      setTimeout(() => { setShowReport(false); setReportSent(false); setReportReason(''); }, 2000);
    } catch (err) {
      console.error('Erreur signalement:', err);
    }
  };

  // Signal view when story changes
  useEffect(() => {
    if (currentStory?.id) {
      viewStory.mutate(currentStory.id);
    }
  }, [currentStory?.id]);

  // Auto-advance progress
  useEffect(() => {
    if (!currentStory || isPaused) return;

    progressRef.current = 0;
    setProgress(0);
    lastTimeRef.current = undefined;
    const DURATION = 5000; // 5 seconds per story

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const elapsed = timestamp - lastTimeRef.current;
      const newProgress = Math.min((progressRef.current + elapsed) / DURATION, 1);

      progressRef.current = progressRef.current + elapsed;
      setProgress(newProgress);
      lastTimeRef.current = timestamp;

      if (newProgress >= 1) {
        goToNext();
        return;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [currentStoryIdx, currentGroupIdx, isPaused]);

  const goToNext = useCallback(() => {
    if (currentStoryIdx < stories.length - 1) {
      setCurrentStoryIdx(prev => prev + 1);
      setProgress(0);
      progressRef.current = 0;
    } else if (currentGroupIdx < groups.length - 1) {
      setCurrentGroupIdx(prev => prev + 1);
      setCurrentStoryIdx(0);
      setProgress(0);
      progressRef.current = 0;
    } else {
      onClose();
    }
  }, [currentStoryIdx, stories.length, currentGroupIdx, groups.length, onClose]);

  const goToPrev = useCallback(() => {
    if (currentStoryIdx > 0) {
      setCurrentStoryIdx(prev => prev - 1);
      setProgress(0);
      progressRef.current = 0;
    } else if (currentGroupIdx > 0) {
      setCurrentGroupIdx(prev => prev - 1);
      setCurrentStoryIdx(groups[currentGroupIdx - 1]?.stories.length - 1 || 0);
      setProgress(0);
      progressRef.current = 0;
    }
  }, [currentStoryIdx, currentGroupIdx, groups]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    setIsPaused(false);
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === ' ') setIsPaused(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goToNext, goToPrev]);

  if (!currentGroup || !currentStory) return null;

  const handleCommerceAction = async (action: string, commerceData: any) => {
    if (!user) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    setActionLoading(action);
    setActionSuccess(null);
    try {
      const { data } = commerceData;
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
        default:
          if (currentStory.linkUrl) window.open(currentStory.linkUrl, '_blank');
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

  const handleStoryClick = () => {
    if (currentStory.linkUrl || currentStory.linkTargetId) {
      clickStory.mutate(currentStory.id);
      if (!commerce) {
        if (currentStory.linkUrl) {
          window.open(currentStory.linkUrl, '_blank');
        }
      }
    }
  };

  const hasLink = !!(currentStory.linkUrl || currentStory.linkTargetId);
  const hasCommerce = !!commerce;
  const actionConfig = commerce ? COMMERCE_ACTIONS[commerce.action] : null;
  const priceDisplay = commerce?.data?.price
    ? Number(commerce.data.price).toLocaleString('fr-FR') + ' FCFA'
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/98 backdrop-blur-sm animate-fade-in">
      {/* Close button + Report — glass */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {!showReport && (
          <button
            onClick={() => setShowReport(true)}
            className="p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/70 hover:bg-white/20 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
            title="Signaler ce contenu"
          >
            <Flag className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bars — animated gradient */}
      <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
        {stories.map((_: any, idx: number) => (
          <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden shadow-sm">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-150',
                idx < currentStoryIdx && 'w-full bg-white',
                idx === currentStoryIdx && 'bg-gradient-to-r from-white via-brand-200 to-white',
                idx > currentStoryIdx && 'w-0'
              )}
              style={idx === currentStoryIdx ? { width: `${progress * 100}%` } : undefined}
            />
          </div>
        ))}
      </div>

      {/* Report form — glass popup */}
      {showReport && (
        <div className="absolute top-16 right-4 z-30 w-64 p-3 rounded-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
          {reportSent ? (
            <div className="flex items-center gap-2 py-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <Check className="w-4 h-4" />
              Signalement envoyé ✓
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Signaler ce contenu</p>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Choisir un motif...</option>
                <option value="CONTENU_INAPPROPRIE">Contenu inapproprié</option>
                <option value="SPAM">Spam</option>
                <option value="HARCELEMENT">Harcèlement</option>
                <option value="FAUSSE_INFO">Fausse information</option>
                <option value="VIOLENCE">Violence</option>
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

      {/* Business info — glass header */}
      <div className="absolute top-6 left-4 z-20">
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 ring-2 ring-white/30">
            {currentGroup.business.logo ? (
              <Image
                src={currentGroup.business.logo}
                alt={currentGroup.business.name}
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                {currentGroup.business.name.charAt(0)}
              </div>
            )}
          </div>
          <span className="text-white text-sm font-medium drop-shadow-sm">{currentGroup.business.name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setIsPaused(prev => !prev); }}
            className="ml-0.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Media content avec transitions */}
      <div
        className="w-full max-w-lg aspect-[9/16] relative cursor-pointer rounded-xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleStoryClick}
      >
        {currentStory.mediaType === 'VIDEO' ? (
          <video
            src={currentStory.mediaUrl}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
        ) : (
          <Image
            src={currentStory.mediaUrl}
            alt={currentStory.caption || ''}
            fill
            className="object-cover transition-transform duration-700"
          />
        )}

        {/* Caption overlay — glass avec CTA commerce */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
          {currentStory.caption && (
            <p className="text-white text-base sm:text-lg font-medium drop-shadow-lg mb-3">{currentStory.caption}</p>
          )}

          {/* Commerce CTA — Bouton d'action direct */}
          {hasCommerce && actionConfig && (
            <div className="space-y-2 animate-fade-in-up">
              {priceDisplay && (
                <div className="inline-block px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-bold shadow-lg">
                  {commerce.type === 'PROMOTION' ? '🔥 ' : ''}{priceDisplay}
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleCommerceAction(commerce.action, commerce); }}
                disabled={actionLoading === commerce.action}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold hover:from-brand-600 hover:to-brand-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-brand-500/30 disabled:opacity-70"
              >
                {actionLoading === commerce.action ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : actionSuccess === commerce.action ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <>
                    {actionConfig.action === 'add_to_cart' ? <ShoppingBag className="w-4 h-4" /> :
                     actionConfig.action === 'order' ? <Package className="w-4 h-4" /> :
                     actionConfig.action === 'book' ? <Calendar className="w-4 h-4" /> :
                     actionConfig.action === 'install' ? <Sparkles className="w-4 h-4" /> :
                     <ExternalLink className="w-4 h-4" />}
                    {actionSuccess === commerce.action ? '✓ Ajouté !' : commerce.label}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Fallback link simple si pas de commerce mais que link existe */}
          {/* Error toast */}
          {actionError && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-red-500/80 backdrop-blur-md text-white text-xs font-medium animate-fade-in">
              {actionError}
            </div>
          )}

          {!hasCommerce && hasLink && !currentStory.caption && (
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-sm text-white/90 hover:bg-white/25 transition-all">
              <ExternalLink className="w-3.5 h-3.5" />
              En savoir plus
            </span>
          )}
        </div>
      </div>

      {/* Navigation arrows — glass */}
      <button
        onClick={(e) => { e.stopPropagation(); goToPrev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg hidden md:flex"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); goToNext(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg hidden md:flex"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
