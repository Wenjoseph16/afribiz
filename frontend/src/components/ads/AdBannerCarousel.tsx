'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ExternalLink, Play, Pause, Sparkles } from 'lucide-react';

interface AdBannerCarouselProps {
  className?: string;
  country?: string;
  autoplaySpeed?: number;
}

export function AdBannerCarousel({ className, country, autoplaySpeed = 5000 }: AdBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const { data: ads, isLoading } = useQuery({
    queryKey: ['ads-carousel', 'BUSINESS_PUBLIC_PAGE', 'HERO_BANNER', country],
    queryFn: async () => {
      const res = await apiClient.get('/ads/active', {
        params: { page: 'BUSINESS_PUBLIC_PAGE', position: 'HERO_BANNER', ...(country ? { country } : {}) },
      });
      return res.data.data || [];
    },
    staleTime: 60000,
  });

  const totalSlides = (ads?.length || 0);

  const goTo = useCallback((index: number) => {
    if (totalSlides === 0) return;
    setCurrentIndex(((index % totalSlides) + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);

  useEffect(() => {
    if (!isAutoPlaying || isPaused || totalSlides <= 1) return;
    const interval = setInterval(goNext, autoplaySpeed);
    return () => clearInterval(interval);
  }, [isAutoPlaying, isPaused, totalSlides, goNext, autoplaySpeed]);

  // ⚠️ IMPORTANT: tous les hooks DOIVENT être avant les early returns
  const currentAd = !isLoading && totalSlides > 0 ? ads[currentIndex] : null;

  useEffect(() => {
    if (currentAd) {
      (async () => {
        try {
          await apiClient.post('/ads/track/impression', {
            creativeId: currentAd.id,
            campaignId: currentAd.campaignId,
            page: 'BUSINESS_PUBLIC_PAGE',
            position: 'HERO_BANNER',
          });
        } catch {}
      })();
    }
  }, [currentIndex]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  if (isLoading || totalSlides === 0) return null;

  const ad = ads[currentIndex];
  const campaign = ad.campaign;
  const business = campaign?.business;

  const trackClick = async () => {
    try {
      await apiClient.post('/ads/track/click', {
        creativeId: ad.id,
        campaignId: ad.campaignId,
        page: 'BUSINESS_PUBLIC_PAGE',
        position: 'HERO_BANNER',
      });
    } catch {}
  };

  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl group', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative overflow-hidden rounded-2xl">
        {ad.mainImage ? (
          <div className="relative h-40 sm:h-48 lg:h-56 w-full">
            <Image src={ad.mainImage ?? ''} alt="" fill className="object-cover transition-transform duration-700 hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center p-6 sm:p-8">
              <div className="max-w-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Sponsorisé
                  </span>
                  {business?.name && (
                    <span className="text-[10px] text-white/60 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full">{business.name}</span>
                  )}
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white drop-shadow-lg line-clamp-2">
                  {ad.adText || campaign?.name || 'Decouvrez cette offre'}
                </p>
                {ad.destinationUrl && (
                  <a href={ad.destinationUrl} target="_blank" rel="noopener noreferrer" onClick={trackClick}
                    className="mt-3 inline-flex items-center gap-1.5 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-all hover:shadow-lg">
                    {ad.cta || 'Decouvrir'} <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-brand/10 via-emerald-50 to-brand/5 dark:from-brand/20 dark:via-emerald-900/20 dark:to-brand/10 p-6 sm:p-8">
            <div className="flex items-center gap-4 flex-wrap">
              {business?.logo && (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md">
                  <Image src={business.logo ?? ''} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-brand uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Sponsorisé
                </span>
                <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {ad.adText || campaign?.name || business?.name || 'Publicite'}
                </p>
              </div>
              {ad.destinationUrl && (
                <a href={ad.destinationUrl} target="_blank" rel="noopener noreferrer" onClick={trackClick}
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-md">
                  {ad.cta || 'Decouvrir'} <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {totalSlides > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-gray-700 transition-all hover:scale-105"
            aria-label="Publicite precedente">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-gray-700 transition-all hover:scale-105"
            aria-label="Publicite suivante">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {totalSlides > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {ads.map((_: any, i: number) => (
            <button key={i} onClick={() => goTo(i)}
              className={cn('w-2 h-2 rounded-full transition-all duration-300',
                i === currentIndex ? 'bg-white w-5 shadow-md' : 'bg-white/50 hover:bg-white/80')}
              aria-label={'Aller a la publicite ' + (i + 1)}
            />
          ))}
          <button onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="ml-2 w-5 h-5 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center hover:bg-white/50 transition-colors"
            aria-label={isAutoPlaying ? 'Pause' : 'Lecture automatique'}>
            {isAutoPlaying ? <Pause className="w-2.5 h-2.5 text-white" /> : <Play className="w-2.5 h-2.5 text-white" />}
          </button>
        </div>
      )}
    </div>
  );
}
