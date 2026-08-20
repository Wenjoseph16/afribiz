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
    <Link href={`/live/${activeLive.id}`} className="block mb-4 group">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 p-1 transition-all duration-500 group-hover:border-red-500/30 group-hover:shadow-lg group-hover:shadow-red-500/5">
          <div className="relative rounded-xl bg-gray-900/80 backdrop-blur-sm px-5 py-4">
            {/* Subtle glow accent */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Live pulse */}
                <div className="relative">
                  <span className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
                  <span className="relative w-3 h-3 bg-red-500 rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                      En direct
                    </span>
                    <span className="text-gray-600">·</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {activeLive.viewerCount || 0}
                    </span>
                    {activeLive._count?.participants ? (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {activeLive._count.participants}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-white font-medium text-sm mt-0.5 truncate max-w-[300px] sm:max-w-none">
                    {activeLive.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white text-xs font-medium transition-all duration-300 shrink-0 group-hover:scale-[1.02]">
                <Play className="w-3.5 h-3.5 text-red-400" />
                Rejoindre
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
