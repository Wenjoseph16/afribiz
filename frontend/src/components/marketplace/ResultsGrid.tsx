'use client';

import { Search, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ResultCard from '@/components/marketplace/ResultCard';
import type { ComparisonItem } from '@/components/marketplace/ComparisonPanel';
import type { ResultItem, BusinessResult } from '@/components/marketplace/cards/types';
import InfiniteScrollSentinel from '@/components/marketplace/InfiniteScrollSentinel';
import MarketplaceAds from '@/components/marketplace/MarketplaceAds';
import AdSlot from '@/components/ads/AdSlot';

interface ResultsGridProps {
  items: ResultItem[];
  view: 'grid' | 'list';
  isLoading: boolean;
  error?: Error | null;
  isSearching: boolean;
  comparisonItems: ComparisonItem[];
  onToggleCompare: (item: ResultItem) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  debouncedQuery?: string;
  clearFilters?: () => void;
  hasActiveFilters?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (item: ResultItem) => void;
}

export default function ResultsGrid({
  items,
  view,
  isLoading,
  error,
  isSearching,
  comparisonItems,
  onToggleCompare,
  hasMore,
  isLoadingMore,
  onLoadMore,
  debouncedQuery = '',
  clearFilters,
  hasActiveFilters = false,
  onToggleSelect,
  selectedIds,
}: ResultsGridProps) {
  return (
    <div className="flex-1 min-w-0">
      {items.length >= 4 && isSearching && (
        <div className="mb-4">
          <MarketplaceAds position="inline" />
        </div>
      )}

      {error ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-400 dark:text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Erreur de recherche
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Une erreur est survenue. Veuillez réessayer.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-medium text-brand hover:text-brand-700 px-4 py-2 rounded-lg border border-brand/20 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
          >
            Réessayer
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-72 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 animate-pulse"
            >
              <div className="h-44 bg-gray-200 dark:bg-gray-700 rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div
            className={cn(
              view === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4'
                : 'space-y-3'
            )}
          >
            {items.map((item: ResultItem) => {
              const b =
                item.type === 'business' ? (item as import('./cards/types').BusinessResult) : null;
              return (
                <div key={`${item.type}-${item.id}`} className="relative group/card">
                  {onToggleSelect && (item.type === 'product' || item.type === 'service') && (
                    <div
                      className={cn(
                        'absolute top-2 left-2 z-10 transition-opacity',
                        selectedIds?.has(`${item.type}-${item.id}`)
                          ? 'opacity-100'
                          : 'opacity-0 group-hover/card:opacity-100'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds?.has(`${item.type}-${item.id}`) || false}
                        onChange={() => onToggleSelect(item)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-brand focus:ring-brand/30 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <ResultCard item={item} view={view} />
                  {item.type === 'business' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompare({
                          id: item.id,
                          name: item.name,
                          rating: item.rating,
                          reviewCount: item.reviewCount,
                          city: item.city,
                          country: item.country,
                          image: item.image,
                          distance: item.distance,
                          businessSlug: b?.businessSlug || item.id,
                          type: 'business',
                          slug: b?.businessSlug || item.id,
                          category: b?.category ?? '',
                          description: b?.description ?? '',
                          badges: b?.badges ?? [],
                          modules: b?.modules ?? [],
                        } as BusinessResult);
                      }}
                      className={cn(
                        'absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all opacity-0 group-hover/card:opacity-100',
                        comparisonItems.find((c) => c.id === item.id)
                          ? 'bg-brand text-white shadow-md'
                          : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand hover:text-brand'
                      )}
                      title="Comparer"
                    >
                      {comparisonItems.find((c) => c.id === item.id) ? '\u2713' : '\u21D4'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {items.length >= 6 && isSearching && (
            <div className="mt-4">
              <AdSlot page="MARKETPLACE" position="SPONSORED_RESULT" />
            </div>
          )}
          {isSearching && (
            <InfiniteScrollSentinel
              hasMore={!!hasMore}
              isLoading={!!isLoadingMore}
              onLoadMore={onLoadMore}
              onIntersect={onLoadMore}
            />
          )}
        </>
      ) : isSearching ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Search className="h-8 w-8 text-gray-300 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Aucun résultat pour "{debouncedQuery}"
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Essayez de modifier vos filtres ou votre recherche.
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Effacer tous les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-gray-300 dark:text-gray-500 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Chargement des données
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Veuillez patienter...</p>
        </div>
      )}
    </div>
  );
}
