'use client';

import Link from 'next/link';
import { Play, Users, Eye } from 'lucide-react';
import { useActiveLives } from '@/hooks/features/useLives';

interface LiveBannerProps {
  businessId: string;
}

export function LiveBanner({ businessId }: LiveBannerProps) {
  const { data, isLoading } = useActiveLives({ businessId, status: 'LIVE' });

  const activeLive = data?.items?.[0];

  if (isLoading || !activeLive) return null;

  return (
    <Link
      href={`/live/${activeLive.id}`}
      className="block mb-6 group"
    >
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-red-600 to-red-500 p-1">
        <div className="rounded-xl bg-gray-900/90 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              <span className="px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                EN DIRECT
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Eye className="w-3.5 h-3.5" />
              <span>{activeLive.viewerCount || 0} spectateurs</span>
              {activeLive.hasEscrow && (
                <>
                  <span className="text-gray-600">|</span>
                  <span className="text-emerald-400 font-medium">🔒 Escrow</span>
                </>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-base truncate">{activeLive.title}</h3>
              <p className="text-gray-400 text-xs mt-0.5">
                {activeLive._count?.participants || 0} participants
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm font-medium transition-all shrink-0">
              <Play className="w-4 h-4" />
              Rejoindre
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
