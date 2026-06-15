'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import FilterSidebar from '@/components/marketplace/FilterSidebar';
import RightSidebar from '@/components/marketplace/RightSidebar';
import EnhancedHero from '@/components/marketplace/EnhancedHero';
import QuickCategories from '@/components/marketplace/QuickCategories';
import SearchToolbar from '@/components/marketplace/SearchToolbar';
import ResultsGrid from '@/components/marketplace/ResultsGrid';
import FloatingActions from '@/components/marketplace/FloatingActions';
import type { ResultItem, BusinessResult, ProductResult, ServiceResult, MenuResult, EventResult, RentalResult, DeveloperResult, ModuleResult } from '@/components/marketplace/ResultCard';
import { TrendingSection, TopBusinessSection } from '@/components/marketplace/TrendingAndTop';
import type { FilterState } from '@/components/marketplace/FilterSidebar';
import { useDebounce } from '@/hooks/useDebounce';
import ComparisonPanel from '@/components/marketplace/ComparisonPanel';
import type { ComparisonItem } from '@/components/marketplace/ComparisonPanel';
import MarketplaceAds from '@/components/marketplace/MarketplaceAds';
import { MarketMapDynamic as MarketMap } from '@/components/marketplace/MarketMapDynamic';

interface MarketplaceContentProps {
  initialCountry?: string;
}

export default function MarketplaceContent({ initialCountry = '' }: MarketplaceContentProps) {
  const router = useRouter();

// --- Item mapper (no hooks, pure function) ---
function mapItem(item: any): ResultItem {
  const _type = item._type || item.type || 'business';
  const base = {
    id: item.id, name: item.name || item.title || '',
    rating: item.rating || 0, reviewCount: item.reviewCount || 0,
    city: item.city || item.business?.city || '',
    country: item.country || item.business?.country || '',
    image: item.logo || item.images?.[0] || item.image || '',
    businessSlug: item.slug || item.business?.slug || item.id,
    distance: item.distanceFormatted || undefined,
  };
  switch (_type) {
    case 'business':
      return { ...base, type: 'business', slug: item.slug, category: item.type || item.category || '',
        description: item.shortDescription || item.description || '',
        badges: [
          ...(item.isVerified ? ['verified'] : []),
          ...(item.isPremium ? ['premium'] : []),
          ...(item.isTopSeller ? ['top_seller'] : []),
          ...(item.isRecommended ? ['recommended'] : []),
        ],
        modules: (item.modules || []).slice(0, 4) } as BusinessResult;
    case 'product':
      return { ...base, type: 'product', price: Number(item.price) || 0, promoPrice: item.promotionalPrice ? Number(item.promotionalPrice) : undefined, businessName: item.business?.name || '', businessId: item.business?.id || '', businessSlug: item.business?.slug || item.slug || item.id || '', available: item.stock > 0 || item.isAvailable, image: item.images?.[0] || '', description: item.shortDescription || item.description || '' } as ProductResult;
    case 'service':
      return { ...base, type: 'service', price: Number(item.price) || 0, duration: item.duration || '', businessName: item.business?.name || '', image: item.images?.[0] || '' } as ServiceResult;
    case 'menu':
      return { ...base, type: 'menu', price: Number(item.price) || 0, restaurant: item.business?.name || '', available: item.isAvailable, image: item.images?.[0] || '' } as MenuResult;
    case 'event':
      return { ...base, type: 'event', date: item.startDate ? new Date(item.startDate).toLocaleDateString('fr-FR') : '', price: Number(item.price) || 0, city: item.address || item.city || '', availableSeats: (item.capacity || 0) - (item.remainingSpots || 0), organizer: item.business?.name || '', image: item.images?.[0] || '' } as EventResult;
    case 'rental':
      return { ...base, type: 'rental', dailyRate: Number(item.price) || 0, weeklyRate: Number(item.price) * 6 || 0, deposit: Number(item.deposit) || 0, available: item.isAvailable, image: item.images?.[0] || '' } as RentalResult;
    case 'developer':
      return { ...base, type: 'developer', photo: item.logo || '', company: item.companyName || item.user?.firstName || '', specialties: item.skills || [], moduleCount: item._moduleCount || 0 } as DeveloperResult;
    case 'module':
      return { ...base, type: 'module', logo: item.logo, developer: item.developer?.companyName || '', version: item.version || '', price: Number(item.price) || 0, installCount: item.totalInstalls || 0 } as ModuleResult;
    default:
      return { ...base, type: 'business', slug: item.slug, category: '', description: '', badges: [], modules: [] } as BusinessResult;
  }
}

  // --- State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(() => ({
    type: '', proximity: '', country: initialCountry, city: '', category: '', subCategory: '',
    minRating: 0, status: [], price: '', priceMin: undefined, priceMax: undefined, availability: [],
  }));
  const [sort, setSort] = useState('popular');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showMap, setShowMap] = useState(false);
  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [accumulatedResults, setAccumulatedResults] = useState<any[]>([]);
  const [accumulatedTotal, setAccumulatedTotal] = useState(0);
  const [accumulatedTotalPages, setAccumulatedTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const perPage = 12;

  // --- Effects: Geolocation ---
  useEffect(() => {
    if ('geolocation' in navigator && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        undefined,
        { timeout: 5000, enableHighAccuracy: false },
      );
    }
  }, [userLocation]);

  // --- Effects: Autocomplete suggestions ---
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSuggestions([]); return; }
    let cancelled = false;
    setLoadingSuggestions(true);
    apiClient.searchMarketplace({ q: searchQuery, limit: 5 })
      .then((res) => {
        if (!cancelled) {
          const items: any[] = res.data.data || [];
          const names = items.map((i: any) => i.name || i.title || '').filter(Boolean);
          setSuggestions(names.slice(0, 6));
          setLoadingSuggestions(false);
        }
      })
      .catch(() => { if (!cancelled) { setSuggestions([]); setLoadingSuggestions(false); } });
    return () => { cancelled = true; };
  }, [searchQuery]);

  // --- Effects: Click outside autocomplete ---
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Queries ---
  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['marketplace-trending'],
    queryFn: async () => {
      const res = await apiClient.getTrendingMarketplace();
      return res.data.data;
    },
    staleTime: 60000,
  });

  const searchParams = useMemo(() => {
    const params: any = { sort, page, limit: perPage };
    if (debouncedQuery) params.q = debouncedQuery;
    if (filters.type) params.type = filters.type;
    if (filters.category) params.category = filters.category;
    if (filters.country) params.country = filters.country;
    if (filters.city) params.city = filters.city;
    if (filters.minRating > 0) params.minRating = filters.minRating;
    if (filters.priceMin !== undefined) params.priceMin = filters.priceMin;
    if (filters.priceMax !== undefined) params.priceMax = filters.priceMax;
    if (activeCategory) params.type = activeCategory;
    if (filters.status.includes('verified')) params.verified = true;
    if (filters.status.includes('premium')) params.premium = true;
    if (filters.proximity && userLocation) {
      params.proximity = filters.proximity;
      params.lat = userLocation.lat;
      params.lng = userLocation.lng;
    } else if (userLocation) {
      params.lat = userLocation.lat;
      params.lng = userLocation.lng;
    }
    if (filters.availability.length > 0) {
      params.availability = filters.availability.join(',');
    }
    return params;
  }, [debouncedQuery, filters, sort, page, activeCategory, userLocation]);

  const { data: searchResults, isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ['marketplace-search', searchParams],
    queryFn: async () => {
      const res = await apiClient.searchMarketplace(searchParams);
      const pagination = (res.data as any)?.pagination || {};
      return { items: res.data.data || [], total: pagination.total || 0, totalPages: pagination.totalPages || 1 };
    },
    enabled: true,
  });

  // --- Effects: Accumulate results for infinite scroll ---
  useEffect(() => {
    if (!searchResults) return;
    if (page === 1) {
      setAccumulatedResults(searchResults.items);
      setAccumulatedTotal(searchResults.total);
      setAccumulatedTotalPages(searchResults.totalPages);
    } else {
      setAccumulatedResults((prev) => {
        const existingIds = new Set(prev.map((r: any) => `${r._type || r.type}-${r.id}`));
        const newItems = searchResults.items.filter((r: any) => !existingIds.has(`${r._type || r.type}-${r.id}`));
        return [...prev, ...newItems];
      });
    }
    setIsLoadingMore(false);
  }, [searchResults, page]);

  // --- Effects: Reset accumulated results when filters change ---
  useEffect(() => {
    setAccumulatedResults([]);
    setAccumulatedTotal(0);
    setAccumulatedTotalPages(1);
  }, [debouncedQuery, filters, sort, activeCategory, userLocation]);

  // --- Derived values ---
  const results = accumulatedResults;
  const totalPages = accumulatedTotalPages;
  const isSearching = !!debouncedQuery || filters.type !== '' || activeCategory !== '' || filters.priceMin !== undefined || filters.priceMax !== undefined || filters.country !== '' || filters.city !== '' || filters.minRating > 0 || filters.status.length > 0 || filters.availability.length > 0;

  const trendingBusinesses: any[] = useMemo(() => {
    if (!trending) return [];
    return (trending.topBusinesses || []).map((b: any) => ({
      ...b, type: 'business', image: b.logo || b.coverImage || '',
      badges: [
        ...(b.isVerified ? ['verified'] : []),
        ...(b.isPremium ? ['premium'] : []),
        ...(b.isTopSeller ? ['top_seller'] : []),
      ],
      modules: (b.modules || []).slice(0, 4),
      afriScore: b.afriScore,
    }));
  }, [trending]);

  const trendingItems: ResultItem[] = useMemo(() => {
    if (!trending) return [];
    const items: ResultItem[] = [];
    (trending.topBusinesses || []).forEach((b: any) => items.push(mapItem({ ...b, _type: 'business' })));
    (trending.topProducts || []).forEach((p: any) => items.push(mapItem({ ...p, _type: 'product', business: { name: p.business?.name } })));
    (trending.topServices || []).forEach((s: any) => items.push(mapItem({ ...s, _type: 'service', business: { name: s.business?.name } })));
    (trending.topEvents || []).forEach((e: any) => items.push(mapItem({ ...e, _type: 'event', business: { name: e.business?.name } })));
    return items;
  }, [trending]);

  const displayItems = isSearching ? results : trendingItems;

  const mapBusinesses = useMemo(() => {
    return displayItems
      .filter((item: any) => item.latitude && item.longitude)
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        slug: item.slug || item.businessSlug,
        latitude: item.latitude,
        longitude: item.longitude,
        logo: item.logo || item.image,
        rating: item.rating,
        type: item.type,
        city: item.city,
      }));
  }, [displayItems]);

  // --- Effects: Scroll to top on page reset ---
  useEffect(() => {
    if (page === 1 && isSearching) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page, isSearching]);

  // --- Callbacks: Comparison ---
  const handleAddToComparison = useCallback((item: ComparisonItem) => {
    setComparisonItems((prev) => {
      if (prev.find((p) => p.id === item.id)) return prev;
      if (prev.length >= 4) return prev;
      const next = [...prev, item];
      setShowComparison(true);
      return next;
    });
  }, []);
  const handleRemoveFromComparison = useCallback((id: string) => {
    setComparisonItems((prev) => prev.filter((p) => p.id !== id));
  }, []);
  const handleClearComparison = useCallback(() => {
    setComparisonItems([]);
    setShowComparison(false);
  }, []);
  const toggleCompareMode = useCallback(() => {
    setShowComparison((s) => !s);
  }, []);

  // --- Callbacks: Navigation ---
  const handleCategorySelect = useCallback((id: string) => { setActiveCategory(id); setPage(1); }, []);
  const handleSearchChange = useCallback((v: string) => { setSearchQuery(v); setPage(1); }, []);
  const handleSearchFocus = useCallback(() => { setShowSuggestions(true); }, []);
  const handleSearchBlur = useCallback(() => { setTimeout(() => setShowSuggestions(false), 200); }, []);
  const handleSelectSuggestion = useCallback((v: string) => { setSearchQuery(v); setShowSuggestions(false); setPage(1); }, []);

  // --- Callbacks: View/Sort ---
  const handleViewChange = useCallback((newView: 'grid' | 'list') => {
    setView(newView);
    setShowMap(false);
  }, []);
  const handleSortChange = useCallback((newSort: string) => {
    setSort(newSort);
    setPage(1);
  }, []);

  // --- Callbacks: Load more ---
  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    setPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  // --- Callbacks: Compare toggle from ResultsGrid ---
  const handleToggleCompare = useCallback((item: any) => {
    handleAddToComparison({
      id: item.id, name: item.name, slug: item.businessSlug || item.id,
      type: item.type, category: item.category, city: item.city,
      country: item.country, rating: item.rating, reviewCount: item.reviewCount,
      isVerified: item.badges?.includes('verified'),
      isPremium: item.badges?.includes('premium'),
      isTopSeller: item.badges?.includes('top_seller'),
      description: item.description, modules: item.modules,
      logo: item.image, distance: item.distance,
    });
  }, [handleAddToComparison]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <EnhancedHero searchQuery={searchQuery} onSearchChange={handleSearchChange}
        onSearchFocus={handleSearchFocus} onSearchBlur={handleSearchBlur}
        suggestionsVisible={showSuggestions} onSelectSuggestion={handleSelectSuggestion}
        suggestions={suggestions} loadingSuggestions={loadingSuggestions} autocompleteRef={autocompleteRef} />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <QuickCategories active={activeCategory} onSelect={handleCategorySelect} />
        <TrendingSection items={trendingBusinesses} isLoading={trendingLoading && !trending} />

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <SearchToolbar
              totalResults={displayItems.length}
              view={view}
              onViewChange={handleViewChange}
              sort={sort}
              onSortChange={handleSortChange}
              showMap={showMap}
              onMapToggle={() => setShowMap((s) => !s)}
              onMobileFilterOpen={() => setShowMobileFilters(true)}
              isSearching={isSearching}
              hasLocation={!!userLocation}
              showMobileSort={showMobileSort}
              onMobileSortToggle={() => setShowMobileSort((s) => !s)}
              onMobileSortClose={() => setShowMobileSort(false)}
            />

            <div className="flex gap-6">
              <FilterSidebar filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />

              {showMobileFilters && (
                <div className="fixed inset-0 z-50 lg:hidden">
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
                  <div className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto p-4">
                    <FilterSidebar filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} onClose={() => setShowMobileFilters(false)} mobile />
                  </div>
                </div>
              )}

              <div className="flex-1 min-w-0">
                {showComparison && comparisonItems.length > 0 && (
                  <div className="mb-6">
                    <ComparisonPanel
                      items={comparisonItems}
                      onRemove={handleRemoveFromComparison}
                      onClear={handleClearComparison}
                    />
                  </div>
                )}

                {showMap ? (
                  mapBusinesses.length > 0 ? (
                    <MarketMap
                      businesses={mapBusinesses}
                      onBusinessClick={(slug) => router.push(`/business/${slug}`)}
                    />
                  ) : (
                    <div className="text-center py-16">
                      <MapPin className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucune localisation</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Les résultats actuels n'ont pas de coordonnées géographiques.</p>
                    </div>
                  )
                ) : (
                  <ResultsGrid
                    items={displayItems}
                    view={view}
                    isLoading={searchLoading}
                    error={searchError as Error | null}
                    isSearching={isSearching}
                    comparisonItems={comparisonItems}
                    onToggleCompare={handleToggleCompare}
                    hasMore={isSearching && page < totalPages}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={handleLoadMore}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:block space-y-6">
            <TopBusinessSection items={trendingBusinesses} isLoading={trendingLoading && !trending} />
            <MarketplaceAds position="sidebar" />
            <RightSidebar trending={trending} />
          </div>
        </div>
      </div>

      <FloatingActions
        comparisonCount={comparisonItems.length}
        onCompareClick={toggleCompareMode}
        onFilterClick={() => setShowMobileFilters(true)}
      />
    </div>
  );
}
