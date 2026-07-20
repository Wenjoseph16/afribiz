'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Rss,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  Eye,
  Star,
  Tag,
  Sparkles,
  ImageIcon,
  Play,
  Calendar,
  MapPin,
  Timer,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useFeed, useTrendingFeed } from '@/features/hooks/feed';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, any> = {
  PRODUCT: Tag,
  SERVICE: Star,
  PROMOTION: Sparkles,
  EVENT: Calendar,
  OFFER_FLASH: Timer,
  STORY: ImageIcon,
  SHORT: Play,
  RENTAL: Tag,
  LIVE: Users,
};

const typeLabels: Record<string, string> = {
  PRODUCT: 'Produit',
  SERVICE: 'Service',
  PROMOTION: 'Promotion',
  EVENT: 'Événement',
  OFFER_FLASH: 'Offre Flash',
  STORY: 'Story',
  SHORT: 'Short',
  RENTAL: 'Location',
  LIVE: 'Live',
};

const typeColors: Record<string, string> = {
  PRODUCT: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  SERVICE: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  PROMOTION: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  EVENT: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  OFFER_FLASH: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  STORY: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  SHORT: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  RENTAL: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  LIVE: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
};

const TAB_OPTIONS = [
  { id: 'all', label: 'Tout', icon: Rss },
  { id: 'trending', label: 'Tendances', icon: TrendingUp },
  { id: 'promotions', label: 'Promotions', icon: Sparkles },
  { id: 'events', label: 'Événements', icon: Calendar },
  { id: 'offers', label: 'Offres Flash', icon: Timer },
];

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState('all');

  const {
    data: feedData,
    isLoading: feedLoading,
    error: feedError,
    refetch: feedRefetch,
  } = useFeed({ limit: 50 });
  const { data: trendingData, isLoading: trendingLoading } = useTrendingFeed({ limit: 10 });

  if (feedError) return <ErrorState message={(feedError as any).message} onRetry={feedRefetch} />;

  const feedItems = feedData?.items || feedData?.data || [];
  const trendingItems = trendingData?.items || trendingData?.data || [];
  const pagination = feedData?.pagination;

  const filteredItems =
    activeTab === 'all'
      ? feedItems
      : activeTab === 'trending'
        ? trendingItems.length > 0
          ? trendingItems
          : feedItems
        : feedItems.filter((item: any) => {
            const type = item.type?.toLowerCase();
            if (activeTab === 'promotions') return type === 'promotion';
            if (activeTab === 'events') return type === 'event';
            if (activeTab === 'offers') return type === 'offer_flash';
            return true;
          });

  const isLoading =
    activeTab === 'trending' && trendingItems.length === 0 ? trendingLoading : feedLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Fil d'actualité"
        description="Découvrez les dernières nouveautés des entreprises et créateurs que vous suivez"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Feed' }]}
      />

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TAB_OPTIONS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                activeTab === tab.id
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Trending banner */}
      {trendingItems.length > 0 && activeTab !== 'trending' && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Tendances</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {trendingItems.slice(0, 5).map((item: any) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-1 mb-1">
                  <Badge variant="warning" size="xs">
                    {typeLabels[item.type] || item.type}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                  {item.title || item.business?.name || 'Nouveauté'}
                </p>
                {item.business && (
                  <p className="text-[10px] text-gray-500 mt-1 truncate">{item.business.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <Loader variant="spinner" size="md" fullScreen />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<Rss className="h-12 w-12" />}
          title="Aucun contenu"
          description="Suivez des entreprises pour voir leurs publications dans votre fil d'actualité"
          action={
            <Link href="/marketplace">
              <Button>Découvrir des entreprises</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main feed */}
          <div className="lg:col-span-2 space-y-4">
            {filteredItems.map((item: any) => {
              const Icon = typeIcons[item.type] || Rss;
              const colorClass = typeColors[item.type] || 'bg-gray-50 text-gray-600';
              const details = item.details;

              return (
                <Card key={item.id} className="p-5 hover:border-brand/20 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn('p-2 rounded-xl', colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'text-[10px] font-medium px-2 py-0.5 rounded-full',
                            colorClass
                          )}
                        >
                          {typeLabels[item.type] || item.type}
                        </span>
                        {item.isFeatured && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            ★ À la une
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                        {item.title || item.business?.name || 'Nouveauté'}
                      </h3>
                      {item.business && (
                        <Link
                          href={`/business/${item.business.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline mt-0.5"
                        >
                          {item.business.logo && (
                            <Image
                              src={item.business.logo}
                              alt=""
                              width={16}
                              height={16}
                              className="w-4 h-4 rounded-full object-cover"
                              unoptimized
                            />
                          )}
                          {item.business.name}
                        </Link>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                      {item.description}
                    </p>
                  )}

                  {/* Details according to type */}
                  {details && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 mb-3">
                      {item.type === 'PROMOTION' && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-red-600">
                            -{details.discountValue}%{' '}
                            {details.promotionType === 'PERCENTAGE' ? '' : 'FCFA'}
                          </span>
                          {details.endsAt && (
                            <span className="text-xs text-gray-500">
                              Jusqu'au {new Date(details.endsAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                      {item.type === 'EVENT' && (
                        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(details.startDate).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </div>
                          {details.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5" />
                              {details.address}
                              {details.city ? `, ${details.city}` : ''}
                            </div>
                          )}
                        </div>
                      )}
                      {item.type === 'OFFER_FLASH' && (
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-bold text-red-600">
                              {Number(details.flashPrice).toLocaleString()} FCFA
                            </span>
                            <span className="text-xs text-gray-400 line-through ml-2">
                              {Number(details.originalPrice).toLocaleString()} FCFA
                            </span>
                          </div>
                          {details.discountPercent && (
                            <Badge variant="danger" size="xs">
                              -{details.discountPercent}%
                            </Badge>
                          )}
                        </div>
                      )}
                      {(item.type === 'PRODUCT' || item.type === 'SERVICE') && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {Number(details.price).toLocaleString()} FCFA
                          </span>
                          {details.rating > 0 && (
                            <div className="flex items-center gap-1 text-xs text-amber-500">
                              <Star className="h-3 w-3 fill-current" />
                              {Number(details.rating).toFixed(1)}
                            </div>
                          )}
                        </div>
                      )}
                      {item.type === 'SHORT' && (
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            {details.duration || '-'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {details.viewsCount || 0}
                          </span>
                        </div>
                      )}
                      {item.type === 'LIVE' && (
                        <div className="flex items-center gap-2">
                          {details.status === 'ACTIVE' && (
                            <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                              EN DIRECT
                            </span>
                          )}
                          <span className="text-xs text-gray-500">{details.title}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {item.createdAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      )}
                      {item.viewsCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {item.viewsCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors">
                        <Heart className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors">
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => {
                    /* pagination handled by query params */
                  }}
                >
                  Page {pagination.page} / {pagination.totalPages}
                </Button>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Trending sidebar */}
            {trendingItems.length > 0 && (
              <Card padding="lg">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />À la une
                </h3>
                <div className="space-y-3">
                  {trendingItems.map((item: any, i: number) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <span className="text-lg font-bold text-gray-300 dark:text-gray-600 w-5 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                          {item.title || item.business?.name || 'Nouveauté'}
                        </p>
                        {item.business && (
                          <p className="text-[10px] text-gray-500">{item.business.name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick stats */}
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Statistiques
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Publications</span>
                  <span className="font-semibold">{feedItems.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Tendances</span>
                  <span className="font-semibold">{trendingItems.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Pages</span>
                  <span className="font-semibold">{pagination?.totalPages || 1}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
