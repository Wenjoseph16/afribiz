'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Sparkles, Loader2, Plus, Store, ChevronRight, Play, Clock, Eye } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import { StoryRing } from '@/components/stories/StoryRing';
import { useActiveStories, useFeedItems, type StoryGroup } from '@/hooks/features/useStories';
import { useAuthStore } from '@/stores/authStore';

export default function StoriesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isBusinessOwner = user?.roles?.includes('BUSINESS');
  const { data: groups, isLoading: storiesLoading } = useActiveStories();
  const { data: feedData, isLoading: feedLoading } = useFeedItems({
    types: 'STORY,SHORT',
    limit: 20,
  });

  const feedItems = feedData?.items || [];

  const [activeFilter, setActiveFilter] = useState<'all' | 'stories' | 'highlights'>('all');

  const handleCreateStory = () => {
    router.push('/dashboard/business/media/stories/create');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Stories"
        description="Découvrez les stories des business et professionnels autour de vous"
        gradient
        actions={
          isBusinessOwner ? (
            <Button size="sm" onClick={handleCreateStory}>
              <Plus className="h-4 w-4 mr-1.5" />
              Créer une story
            </Button>
          ) : undefined
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/30">
              <Sparkles className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {groups?.length || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Business actifs</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Play className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {feedItems.length || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Stories récentes</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">24h</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Durée des stories</p>
            </div>
          </div>
        </Card>
        <Link href="/marketplace">
          <Card className="p-4 hover:border-brand/30 transition-colors cursor-pointer h-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand">Explorer</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Découvrir des business</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Story rings */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Stories récentes</h2>
          <Link
            href="/marketplace"
            className="text-sm font-medium text-brand hover:text-brand-700 dark:hover:text-brand-400 flex items-center gap-1"
          >
            Tout voir
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {storiesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : (
          <StoryRing />
        )}
      </Card>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {[
          { value: 'all', label: 'Toutes' },
          { value: 'stories', label: 'Stories' },
          { value: 'highlights', label: 'En vedette' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value as any)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
              activeFilter === tab.value
                ? 'bg-brand text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed stories */}
      {feedLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : feedItems.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-12 w-12" />}
          title="Aucune story pour le moment"
          description="Les stories des business apparaîtront ici. Revenez bientôt !"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {feedItems
            .filter((item: any) => {
              if (activeFilter === 'stories') return item.type === 'STORY';
              if (activeFilter === 'highlights') return item.isFeatured;
              return true; // 'all'
            })
            .map((item: any) => (
              <Link
                key={item.id}
                href={item.linkUrl || `/business/${item.business?.slug}`}
                className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand/30 hover:shadow-lg transition-all duration-300"
              >
                {item.mediaUrl ? (
                  <Image
                    src={item.mediaUrl}
                    alt={item.title || ''}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Business info */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                      {item.business?.logo ? (
                        <Image
                          src={item.business.logo}
                          alt=""
                          width={24}
                          height={24}
                          className="object-cover"
                        />
                      ) : (
                        item.business?.name?.charAt(0) || '?'
                      )}
                    </div>
                    <span className="text-xs text-white/90 font-medium truncate">
                      {item.business?.name || 'Business'}
                    </span>
                  </div>
                  {item.title && (
                    <p className="text-[11px] text-white/70 line-clamp-2">{item.title}</p>
                  )}
                </div>

                {/* Type badge */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur text-[9px] font-medium text-white">
                  {item.type === 'STORY' ? 'Story' : 'Short'}
                </div>
              </Link>
            ))}
        </div>
      )}

      {/* Pagination */}
      {feedData && feedData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button variant="outline" size="sm">
            Voir plus
          </Button>
        </div>
      )}
    </div>
  );
}
