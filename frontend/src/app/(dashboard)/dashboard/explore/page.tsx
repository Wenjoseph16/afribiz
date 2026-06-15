'use client';

import { useState } from 'react';

import Link from 'next/link';
import { 
  RefreshCw, Package, Calendar, 
  TrendingUp, Clock, MapPin, Star,
  ShoppingBag, Megaphone, Film,
  Sparkles, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StoryRing } from '@/components/stories/StoryRing';
import Image from 'next/image';
import { useFeedItems } from '@/hooks/features/useStories';

const FEED_TABS = [
  { label: 'Tout', value: '', icon: Sparkles },
  { label: 'Produits', value: 'PRODUCT', icon: Package },
  { label: 'Promotions', value: 'PROMOTION', icon: Megaphone },
  { label: 'Événements', value: 'EVENT', icon: Calendar },
  { label: 'Réalisations', value: 'PORTFOLIO', icon: Film },
];

const typeConfig: Record<string, { label: string; variant: 'brand' | 'success' | 'warning' | 'info' | 'purple' | 'default' }> = {
  PRODUCT: { label: 'Produit', variant: 'brand' },
  SERVICE: { label: 'Service', variant: 'info' },
  PROMOTION: { label: 'Promotion', variant: 'warning' },
  EVENT: { label: 'Événement', variant: 'purple' },
  STORY: { label: 'Story', variant: 'default' },
  PORTFOLIO: { label: 'Réalisation', variant: 'success' },
  OFFER_FLASH: { label: 'Offre Flash', variant: 'warning' },
};

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);

  const { data: feedData, isLoading, isFetching } = useFeedItems({
    types: activeTab || undefined,
    page,
    limit: 12,
  });

  const items = feedData?.items || [];
  const totalPages = feedData?.totalPages || 1;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Explorer</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Découvrez les meilleurs business et offres près de chez vous
        </p>
      </div>

      {/* Stories Ring */}
      <Card padding="md" variant="elevated" className="overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            Stories du moment
          </h2>
        </div>
        <StoryRing />
      </Card>

      {/* Feed Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {FEED_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setPage(1); }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
                isActive
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Feed Grid avec staggered animations */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-12 border-dashed border-2 border-gray-200 dark:border-gray-700 bg-transparent">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Aucun contenu dans le feed pour le moment</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md">
              Suivez des businesses pour voir leurs publications ici
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item: any, idx: number) => {
              const config = typeConfig[item.type] || { label: item.type, variant: 'default' };
              return (
                <Link
                  key={item.id}
                  href={item.linkUrl || `/business/${item.business?.slug || item.businessId || item.id}`}
                  className="group block animate-fade-in-up"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-brand-300/50 dark:hover:border-brand-700/50">
                    {/* Media */}
                    <div className="aspect-[4/3] relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
                      {item.mediaUrl ? (
                        <Image
                          src={item.mediaUrl}
                          alt={item.title || ''}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                        </div>
                      )}
                      {/* Overlay badge */}
                      <div className="absolute top-3 left-3">
                        <Badge variant={config.variant} size="sm">
                          {config.label}
                        </Badge>
                      </div>
                      {/* Business info overlay */}
                      {item.business && (
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
                              {item.business.logo ? (
                                <Image
                                  src={item.business.logo}
                                  alt={item.business.name}
                                  width={24}
                                  height={24}
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                  {item.business.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <span className="text-white text-xs font-medium truncate">
                              {item.business.name}
                            </span>
                            {item.business.city && (
                              <span className="text-white/60 text-[10px] flex items-center gap-0.5 ml-auto">
                                <MapPin className="w-3 h-3" />
                                {item.business.city}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content — glass */}
                    <div className="p-4 bg-gradient-to-b from-transparent to-white/30 dark:to-gray-800/30">
                      {item.title && (
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {item.title}
                        </h3>
                      )}
                      {item.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100/50 dark:border-gray-700/30">
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-xs text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                          Voir <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 hover:border-brand-300 transition-colors"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 hover:border-brand-300 transition-colors"
              >
                Suivant
              </button>
            </div>
          )}

          {isFetching && (
            <div className="flex justify-center mt-4">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
