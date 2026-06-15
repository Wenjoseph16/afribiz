'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Film, Plus, TrendingUp, Clock,
  Sparkles, ArrowRight, Users, Heart,
  MessageCircle, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShortsFeedDynamic as ShortsFeed } from '@/components/stories/ShortsFeedDynamic';
import { useShorts } from '@/hooks/features/useShorts';

export default function ShortsPage() {
  const [view, setView] = useState<'feed' | 'browse'>('feed');
  const [selectedBusiness, setSelectedBusiness] = useState<string | undefined>(undefined);

  const { data: shortsData, isLoading } = useShorts({ limit: 8 });

  const shorts = shortsData?.items || [];

  // Extract unique businesses for the business picker
  const businesses = shorts.reduce((acc: any[], s: any) => {
    if (s.business && !acc.find(b => b.id === s.business.id)) {
      acc.push({ ...s.business, shortsCount: (acc.find(b => b.id === s.business.id)?.shortsCount || 0) + 1 });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Shorts Business
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vidéos courtes de vos commerces préférés
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('feed')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              view === 'feed'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            )}
          >
            <Play className="w-4 h-4 inline mr-1" />
            Feed
          </button>
          <button
            onClick={() => setView('browse')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              view === 'browse'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            )}
          >
            <Film className="w-4 h-4 inline mr-1" />
            Parcourir
          </button>
        </div>
      </div>

      {view === 'feed' ? (
        /* TikTok-like feed view */
        <div className="max-w-lg mx-auto">
          {/* Business selector */}
          {businesses.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none mb-4">
              <button
                onClick={() => setSelectedBusiness(undefined)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
                  !selectedBusiness
                    ? 'bg-brand-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                )}
              >
                <Sparkles className="w-3 h-3" />
                Tous
              </button>
              {businesses.map((b: any) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBusiness(b.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
                    selectedBusiness === b.id
                      ? 'bg-brand-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                  )}
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                    {b.logo ? (
                      <Image src={b.logo} alt="" width={20} height={20} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-500">
                        {b.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  {b.name}
                </button>
              ))}
            </div>
          )}

          {/* Shorts Feed */}
          <ShortsFeed businessId={selectedBusiness} />
        </div>
      ) : (
        /* Browse grid view */
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card padding="md" variant="elevated">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-brand-100 dark:bg-brand-900/20">
                  <Film className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{shortsData?.total || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Shorts publiés</p>
                </div>
              </div>
            </Card>
            <Card padding="md" variant="elevated">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{businesses.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Businesses actives</p>
                </div>
              </div>
            </Card>
            <Card padding="md" variant="elevated">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {shorts.reduce((sum: number, s: any) => sum + (s._count?.likes || s.likesCount || 0), 0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total likes</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[9/16] rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
              ))}
            </div>
          ) : shorts.length === 0 ? (
            <Card className="text-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Film className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">Aucun short pour le moment</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Les commerces peuvent publier des vidéos courtes pour promouvoir leurs produits
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {shorts.map((short: any) => (
                <Link
                  key={short.id}
                  href={'/dashboard/shorts' + (short.id ? '?id=' + short.id : '')}
                  className="group block"
                  onClick={(e) => {
                    e.preventDefault();
                    setView('feed');
                    setSelectedBusiness(short.business?.id);
                  }}
                >
                  <div className="aspect-[9/16] rounded-2xl bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
                    {/* Thumbnail */}
                    {short.thumbnailUrl ? (
                      <Image
                        src={short.thumbnailUrl}
                        alt={short.title || ''}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : short.videoUrl ? (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <Play className="w-10 h-10 text-gray-600" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-900/20 to-purple-900/20">
                        <Film className="w-10 h-10 text-gray-400" />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Business info */}
                    {short.business && (
                      <div className="absolute top-3 left-3 right-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
                            {short.business.logo ? (
                              <Image src={short.business.logo} alt="" width={24} height={24} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold">
                                {short.business.name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="text-white text-xs font-medium truncate drop-shadow-lg">
                            {short.business.name}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
                      <div className="flex items-center gap-1 text-white text-xs drop-shadow-lg">
                        <Heart className="w-3 h-3" />
                        <span>{short._count?.likes || short.likesCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-white text-xs drop-shadow-lg">
                        <MessageCircle className="w-3 h-3" />
                        <span>{short._count?.comments || short.commentsCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mt-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                      {short.title || 'Short'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                      {short.description || ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
