'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import Image from 'next/image';
import { ExternalLink, X, Flag, CheckCircle } from 'lucide-react';
import type { AdCreative, AdPlacementPage, AdPlacementPosition } from '@/types/ads';

interface AdSlotProps {
  page: AdPlacementPage;
  position: AdPlacementPosition;
  className?: string;
  country?: string;
  dismissible?: boolean;
}

const POSITION_STYLES: Record<AdPlacementPosition, string> = {
  HERO_BANNER: 'relative bg-gradient-to-r from-brand/5 via-emerald-50 to-brand/5 dark:from-brand/10 dark:via-emerald-900/10 dark:to-brand/10 rounded-2xl border border-brand/10 dark:border-brand/20 overflow-hidden',
  TOP_BANNER: 'relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden',
  BOTTOM_BANNER: 'relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden',
  SIDEBAR: 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4',
  SPONSORED_CARD: 'bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-brand/30 transition-all p-4',
  SPONSORED_RESULT: 'flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-brand/5 to-transparent border border-brand/10',
  CAROUSEL: 'relative rounded-xl overflow-hidden',
  FEATURED_BLOCK: 'relative bg-gradient-to-br from-brand/10 via-emerald-50/50 to-brand/5 dark:from-brand/20 dark:via-emerald-900/20 dark:to-brand/10 rounded-2xl border border-brand/10 p-6',
  PROMO_WIDGET: 'bg-gradient-to-r from-brand/5 to-emerald-50 dark:from-brand/10 dark:to-emerald-900/10 rounded-xl border border-brand/10 dark:border-brand/20 p-3',
  RECOMMENDED: 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3',
  POPUP: 'fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50',
};

export default function AdSlot({ page, position, className, country, dismissible }: AdSlotProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (reportRef.current && !reportRef.current.contains(e.target as Node)) {
        setShowReport(false);
      }
    };
    if (showReport) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReport]);

  const ReportButton = () => {
    const doReport = async () => {
      const c = ads?.[0];
      if (!c || !reportReason) return;
      try {
        await apiClient.post('/ads/report', {
          campaignId: c.campaignId,
          reason: reportReason,
        });
        setReportSent(true);
        setTimeout(() => { setShowReport(false); setReportSent(false); setReportReason(''); }, 2000);
      } catch {}
    };
    return (
      <div className="relative" ref={reportRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowReport(!showReport); }}
          className="text-[9px] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-0.5 opacity-0 group-hover:opacity-100"
          title="Signaler cette publicité"
        >
          <Flag className="h-2.5 w-2.5" /> Signaler
        </button>
        {showReport && (
          <div className="absolute bottom-full left-0 mb-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50">
            {reportSent ? (
              <div className="flex items-center gap-2 text-emerald-600 text-xs">
                <CheckCircle className="h-3.5 w-3.5" /> Signalement envoyé
              </div>
            ) : (
              <>
                <p className="text-[10px] font-semibold text-gray-900 dark:text-white mb-2">Signaler cette pub</p>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full text-[11px] border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
                >
                  <option value="">Motif...</option>
                  <option value="INAPPROPRIATE">Contenu inapproprié</option>
                  <option value="SPAM">Spam</option>
                  <option value="MISLEADING">Trompeur</option>
                  <option value="OFFENSIVE">Offensant</option>
                  <option value="OTHER">Autre</option>
                </select>
                <div className="flex gap-1.5">
                  <button onClick={() => setShowReport(false)} className="flex-1 text-[10px] px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
                  <button onClick={doReport} disabled={!reportReason} className="flex-1 text-[10px] px-2 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed">Signaler</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const { data: ads, isLoading } = useQuery({
    queryKey: ['ads', page, position, country],
    queryFn: async () => {
      const res = await apiClient.get('/ads/active', {
        params: { page, position, ...(country ? { country } : {}) },
      });
      return res.data.data || [];
    },
    staleTime: 120000,
    enabled: !dismissed,
  });

  const trackImpression = useCallback(async (creative: AdCreative) => {
    try {
      await apiClient.post('/ads/track/impression', {
        creativeId: creative.id,
        campaignId: creative.campaignId,
        page,
        position,
      });
    } catch {}
  }, [page, position]);

  const handleClick = useCallback(async (e: React.MouseEvent, creative: AdCreative) => {
    try {
      await apiClient.post('/ads/track/click', {
        creativeId: creative.id,
        campaignId: creative.campaignId,
        page,
        position,
      });
    } catch {}
  }, [page, position]);

  useEffect(() => {
    if (ads?.length > 0) {
      trackImpression(ads[0]);
    }
  }, [ads, trackImpression]);

  if (isLoading || !ads || ads.length === 0 || dismissed) return null;

  const creative: AdCreative = ads[0];
  const business = (creative as any).campaign?.business;

  const renderHeroBanner = () => (
    <div className={cn(POSITION_STYLES.HERO_BANNER, className)}>
      {creative.mainImage && (
        <div className="relative h-48 sm:h-64">
          <Image src={creative.mainImage ?? ''} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
        </div>
      )}
      {!creative.mainImage && (
        <div className="flex items-center gap-4 p-6">
          {business?.logo && (
            <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
              <Image src={business.logo ?? ''} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
            </div>
          )}
          <div className="flex-1">
            <span className="text-[10px] font-semibold text-brand uppercase tracking-wider">Sponsorisé</span>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{creative.adText || (creative as any).campaign?.name || business?.name || 'Publicité'}</p>
          </div>
          {creative.destinationUrl && (
            <a href={creative.destinationUrl} target="_blank" rel="noopener noreferrer"
              onClick={(e) => handleClick(e, creative)}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors">
              {creative.cta || 'Découvrir'} <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );

  const renderBanner = () => (
    <div className={cn(POSITION_STYLES[position], 'group', className)}>
      <div className="flex items-center gap-3 p-4">
        {creative.mainImage && (
          <Image src={creative.mainImage ?? ''} alt="" width={80} height={56} className="rounded-lg object-cover shrink-0" unoptimized />
        )}
        {business?.logo && (
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
            <Image src={business.logo ?? ''} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-semibold text-brand uppercase tracking-wider">Sponsorisé</span>
            <ReportButton />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{creative.adText || (creative as any).campaign?.name || business?.name}</p>
        </div>
        {creative.destinationUrl && (
          <a href={creative.destinationUrl} target="_blank" rel="noopener noreferrer"
            onClick={(e) => handleClick(e, creative)}
            className="shrink-0 text-xs font-semibold text-brand whitespace-nowrap hover:underline">
            {creative.cta || 'Voir'} →
          </a>
        )}
      </div>
    </div>
  );

  const renderSidebar = () => (
    <div className={cn(POSITION_STYLES.SIDEBAR, 'group', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-brand uppercase tracking-wider">Sponsorisé</span>
        <div className="flex items-center gap-1">
          <ReportButton />
          {dismissible && (
            <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {business?.logo && (
          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
            <Image src={business.logo ?? ''} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
          </div>
        )}
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {business?.name || (creative as any).campaign?.name || 'Sponsorisé'}
        </p>
      </div>
      {creative.adText && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">{creative.adText}</p>
      )}
      {creative.destinationUrl && (
        <a href={creative.destinationUrl} target="_blank" rel="noopener noreferrer"
          onClick={(e) => handleClick(e, creative)}
          className="mt-3 block text-center text-xs font-semibold text-brand border border-brand/20 rounded-lg py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
          {creative.cta || 'En savoir plus'}
        </a>
      )}
    </div>
  );

  const renderCard = () => (
    <div className={cn(POSITION_STYLES.SPONSORED_CARD, className)}>
      <span className="text-[9px] font-bold text-brand uppercase">Sponsorisé</span>
      {creative.mainImage && (
        <div className="relative h-24 mt-2 rounded-lg overflow-hidden">
          <Image src={creative.mainImage ?? ''} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
        </div>
      )}
      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2 line-clamp-2">{creative.adText || (creative as any).campaign?.name}</p>
      {creative.destinationUrl && (
        <a href={creative.destinationUrl} target="_blank" rel="noopener noreferrer"
          onClick={(e) => handleClick(e, creative)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand">
          {creative.cta || 'En savoir plus'} →
        </a>
      )}
    </div>
  );

  const renderRow = () => (
    <div className={cn(POSITION_STYLES.SPONSORED_RESULT, className)}>
      {business?.logo && (
        <Image src={business.logo ?? ''} alt="" width={32} height={32} className="rounded-lg object-cover shrink-0" unoptimized />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500">Sponsorisé</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{creative.adText || business?.name}</p>
      </div>
      {creative.destinationUrl && (
        <a href={creative.destinationUrl} target="_blank" rel="noopener noreferrer"
          onClick={(e) => handleClick(e, creative)}
          className="text-xs font-semibold text-brand shrink-0">Voir</a>
      )}
    </div>
  );

  const renderWidget = () => (
    <div className={cn(POSITION_STYLES.PROMO_WIDGET, className)}>
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold text-brand uppercase">Pub</span>
        {business?.logo && (
          <Image src={business.logo ?? ''} alt="" width={20} height={20} className="rounded object-cover" unoptimized />
        )}
        <p className="text-xs font-medium text-gray-900 dark:text-white truncate flex-1">
          {creative.adText || business?.name || ''}
        </p>
        {creative.destinationUrl && (
          <a href={creative.destinationUrl} target="_blank" rel="noopener noreferrer"
            onClick={(e) => handleClick(e, creative)}
            className="text-[10px] font-semibold text-brand">
            {creative.cta || 'Voir'} →
          </a>
        )}
      </div>
    </div>
  );

  const renderPopup = () => (
    <div className={cn(POSITION_STYLES.POPUP, className)}>
      <div className="flex items-start justify-between p-4 pb-2">
        <span className="text-[10px] font-semibold text-brand uppercase tracking-wider">Sponsorisé</span>
        {dismissible && (
          <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600 -mt-1 -mr-1 p-1">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {creative.mainImage && (
        <div className="relative h-32">
          <Image src={creative.mainImage ?? ''} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
        </div>
      )}
      <div className="p-4 pt-3">
        <p className="text-sm font-bold text-gray-900 dark:text-white">{creative.adText || (creative as any).campaign?.name}</p>
        {creative.destinationUrl && (
          <a href={creative.destinationUrl} target="_blank" rel="noopener noreferrer"
            onClick={(e) => handleClick(e, creative)}
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand">
            {creative.cta || 'Découvrir'} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );

  switch (position) {
    case 'HERO_BANNER': return renderHeroBanner();
    case 'TOP_BANNER':
    case 'BOTTOM_BANNER': return renderBanner();
    case 'SIDEBAR': return renderSidebar();
    case 'SPONSORED_CARD':
    case 'FEATURED_BLOCK': return renderCard();
    case 'SPONSORED_RESULT': return renderRow();
    case 'CAROUSEL': return renderCard();
    case 'PROMO_WIDGET':
    case 'RECOMMENDED': return renderWidget();
    case 'POPUP': return renderPopup();
    default: return renderWidget();
  }
}
