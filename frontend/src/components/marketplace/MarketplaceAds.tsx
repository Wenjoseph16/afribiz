'use client';

import Image from 'next/image';
import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import { ExternalLink } from 'lucide-react';

interface MarketplaceAdsProps {
  position?: 'banner' | 'sidebar' | 'inline';
  className?: string;
}

export default function MarketplaceAds({ position = 'banner', className }: MarketplaceAdsProps) {
  const { data: ads, isLoading } = useQuery({
    queryKey: ['marketplace-ads', position],
    queryFn: async () => {
      const res = await apiClient.getActiveMarketplaceAds({
        page: 'marketplace',
        position,
      });
      return res.data.data || [];
    },
    staleTime: 120000,
  });

  const trackImpression = useCallback(async (creativeId: string, campaignId: string) => {
    try {
      await apiClient.post('/ads/track/impression', {
        creativeId,
        campaignId,
        page: 'marketplace',
        position,
      });
    } catch {}
  }, [position]);

  const handleClick = useCallback(async (e: React.MouseEvent, creativeId: string, campaignId: string) => {
    try {
      await apiClient.post('/ads/track/click', {
        creativeId,
        campaignId,
        page: 'marketplace',
        position,
      });
    } catch {}
  }, [position]);

  useEffect(() => {
    if (ads?.length > 0) {
      const ad = ads[0];
      trackImpression(ad.id, ad.campaignId);
    }
  }, [ads, trackImpression]);

  if (isLoading || !ads || ads.length === 0) return null;

  const ad = ads[0];
  const campaign = ad.campaign;
  const business = campaign?.business;
  const ctaLabel = ad.cta || 'Découvrir';

  if (position === 'banner') {
    return (
      <div className={cn('w-full', className)}>
        <div className="relative bg-gradient-to-r from-brand/5 via-emerald-50 to-brand/5 dark:from-brand/10 dark:via-emerald-900/10 dark:to-brand/10 rounded-2xl border border-brand/10 dark:border-brand/20 overflow-hidden">
          {ad.mainImage && (
            <div className="relative h-32 sm:h-40">
              <Image src={ad.mainImage ?? ''} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
            </div>
          )}
          {!ad.mainImage && (
            <div className="flex items-center gap-4 p-5">
              {business?.logo && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                  <Image src={business.logo ?? ''} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                </div>
              )}
              <div className="flex-1">
                <span className="text-[10px] font-semibold text-brand uppercase tracking-wider">Sponsorisé</span>
                <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{ad.adText || campaign?.name || business?.name || 'Publicité'}</p>
              </div>
              {ad.destinationUrl && (
                <a
                  href={ad.destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleClick(e, ad.id, ad.campaignId)}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition-colors"
                >
                  {ctaLabel} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (position === 'sidebar') {
    return (
      <div className={cn('bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4', className)}>
        <span className="text-[10px] font-semibold text-brand uppercase tracking-wider">Sponsorisé</span>
        <div className="flex items-center gap-2 mt-2">
          {business?.logo && (
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
              <Image src={business.logo ?? ''} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
            </div>
          )}
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {business?.name || 'Sponsorisé'}
          </p>
        </div>
        {ad.adText && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{ad.adText}</p>
        )}
        {ad.destinationUrl && (
          <a
            href={ad.destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => handleClick(e, ad.id, ad.campaignId)}
            className="mt-3 block text-center text-xs font-semibold text-brand border border-brand/20 rounded-lg py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
          >
            {ctaLabel}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={cn('bg-gradient-to-r from-brand/5 to-emerald-50 dark:from-brand/10 dark:to-emerald-900/10 rounded-xl border border-brand/10 dark:border-brand/20 p-3', className)}>
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold text-brand uppercase">Pub</span>
        {business?.logo && (
          <Image src={business.logo ?? ''} alt="" width={20} height={20} className="rounded object-cover" unoptimized />
        )}
        <p className="text-xs font-medium text-gray-900 dark:text-white truncate flex-1">
          {ad.adText || business?.name || ''}
        </p>
        {ad.destinationUrl && (
          <a href={ad.destinationUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => handleClick(e, ad.id, ad.campaignId)} className="text-[10px] font-semibold text-brand">
            {ctaLabel} →
          </a>
        )}
      </div>
    </div>
  );
}
