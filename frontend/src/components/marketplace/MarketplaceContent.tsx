'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, X, Sparkles, ChevronRight, ShoppingCart } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import FilterSidebar from '@/components/marketplace/FilterSidebar';
import RightSidebar from '@/components/marketplace/RightSidebar';
import EnhancedHero from '@/components/marketplace/EnhancedHero';
import QuickCategories from '@/components/marketplace/QuickCategories';
import SearchToolbar from '@/components/marketplace/SearchToolbar';
import ResultsGrid from '@/components/marketplace/ResultsGrid';
import FloatingActions from '@/components/marketplace/FloatingActions';
import type {
  ResultItem,
  BusinessResult,
  ProductResult,
  ServiceResult,
  MenuResult,
  EventResult,
  RentalResult,
  RoomResult,
  TrainingResult,
  DeveloperResult,
  ModuleResult,
} from '@/components/marketplace/ResultCard';
import { TrendingSection, TopBusinessSection } from '@/components/marketplace/TrendingAndTop';
import { StoryRing } from '@/components/stories/StoryRing';
import type { ApiSearchItem } from '@/components/marketplace/cards/search-types';
import type { FilterState } from '@/components/marketplace/FilterSidebar';
import { useCartStore } from '@/stores/cartStore';
import type { CartItem } from '@/stores/cartStore';
import { useDebounce } from '@/hooks/useDebounce';
import ComparisonPanel from '@/components/marketplace/ComparisonPanel';
import type { ComparisonItem } from '@/components/marketplace/ComparisonPanel';
import MarketplaceAds from '@/components/marketplace/MarketplaceAds';
import AdSlot from '@/components/ads/AdSlot';
import { MarketMapDynamic as MarketMap } from '@/components/marketplace/MarketMapDynamic';
import { usePersistentFilters } from '@/components/marketplace/FilterSidebar';
import RecentlyViewed from '@/components/marketplace/RecentlyViewed';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import type { PremiumBusiness } from '@/components/marketplace/PremiumBusinessCard';

interface MarketplaceContentProps {
  initialCountry?: string;
}

export default function MarketplaceContent({ initialCountry = '' }: MarketplaceContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Search query parser ---
  function parseSearchQuery(query: string): {
    terms: string[];
    excluded: string[];
    phrases: string[];
  } {
    if (!query) return { terms: [], excluded: [], phrases: [] };

    const terms: string[] = [];
    const excluded: string[] = [];
    const phrases: string[] = [];

    // Extract quoted phrases
    const phraseRegex = /"([^"]+)"/g;
    let match;
    while ((match = phraseRegex.exec(query)) !== null) {
      phrases.push(match[1]);
    }

    // Remove phrases from query
    let remainingQuery = query.replace(phraseRegex, '').trim();

    // Split by whitespace and handle operators
    const tokens = remainingQuery.split(/\s+/).filter(Boolean);

    for (const token of tokens) {
      if (token.startsWith('-') || token.startsWith('NOT ')) {
        const excludedTerm = token.startsWith('-') ? token.slice(1) : token.slice(4);
        if (excludedTerm) excluded.push(excludedTerm);
      } else if (token.toUpperCase() === 'OR' || token.toUpperCase() === 'AND') {
        // Skip boolean operators for now, they'll be handled by the API
      } else {
        terms.push(token);
      }
    }

    return { terms, excluded, phrases };
  }

  // --- Item mapper (no hooks, pure function) ---
  function mapItem(item: ApiSearchItem): ResultItem {
    const _type = item._type || item.type || 'business';
    const base = {
      id: item.id,
      name: item.name || item.title || '',
      rating: item.rating || 0,
      reviewCount: item.reviewCount || 0,
      city: item.city || item.business?.city || '',
      country: item.country || item.business?.country || '',
      image: item.logo || item.images?.[0] || item.image || '',
      businessSlug: item.slug || item.business?.slug || item.id,
      distance: item.distanceFormatted || undefined,
      layawayOfferId: item.layawayOfferId || undefined,
    };
    switch (_type) {
      case 'business':
        return {
          ...base,
          type: 'business',
          slug: item.slug,
          category: item.type || item.category || '',
          description: item.shortDescription || item.description || '',
          badges: [
            ...(item.isVerified ? ['verified'] : []),
            ...(item.isPremium ? ['premium'] : []),
            ...(item.isTopSeller ? ['top_seller'] : []),
            ...(item.isRecommended ? ['recommended'] : []),
          ],
          modules: (item.modules || []).slice(0, 4),
        } as BusinessResult;
      case 'product':
        return {
          ...base,
          type: 'product',
          price: Number(item.price) || 0,
          promoPrice: item.promotionalPrice ? Number(item.promotionalPrice) : undefined,
          businessName: item.business?.name || '',
          businessId: item.business?.id || '',
          businessSlug: item.business?.slug || item.slug || item.id || '',
          available: (item.stock ?? 0) > 0 || !!item.isAvailable,
          image: item.images?.[0] || '',
          description: item.shortDescription || item.description || '',
          negotiable: !!item.negotiable,
          reviews: item.reviews?.slice(0, 1),
        } as ProductResult;
      case 'service':
        return {
          ...base,
          type: 'service',
          price: Number(item.price) || 0,
          duration: item.duration || '',
          businessName: item.business?.name || '',
          image: item.images?.[0] || '',
        } as ServiceResult;
      case 'menu':
        return {
          ...base,
          type: 'menu',
          price: Number(item.price) || 0,
          restaurant: item.business?.name || '',
          available: item.isAvailable,
          image: item.images?.[0] || '',
        } as MenuResult;
      case 'event':
        return {
          ...base,
          type: 'event',
          date: item.startDate ? new Date(item.startDate).toLocaleDateString('fr-FR') : '',
          price: Number(item.price) || 0,
          city: item.address || item.city || '',
          availableSeats: (item.capacity || 0) - (item.remainingSpots || 0),
          organizer: item.business?.name || '',
          image: item.images?.[0] || '',
        } as EventResult;
      case 'rental':
        return {
          ...base,
          type: 'rental',
          dailyRate: Number(item.price) || 0,
          weeklyRate: Number(item.price) * 6 || 0,
          deposit: Number(item.deposit) || 0,
          available: item.isAvailable,
          image: item.images?.[0] || '',
        } as RentalResult;
      case 'room':
        return {
          ...base,
          type: 'room',
          pricePerNight: Number(item.price) || 0,
          promoPrice: item.promotionalPrice ? Number(item.promotionalPrice) : undefined,
          roomType: item.type || '',
          capacity: item.capacity || 2,
          businessName: item.business?.name || '',
          available: item.isActive !== false,
          image: item.images?.[0] || item.image || '',
        } as RoomResult;
      case 'training':
        return {
          ...base,
          type: 'training',
          price: Number(item.price) || 0,
          duration: item.duration || '',
          lessons: item.lessons || 0,
          category: item.category || '',
          businessName: item.business?.name || '',
        } as TrainingResult;
      case 'developer':
        return {
          ...base,
          type: 'developer',
          photo: item.logo || '',
          company: item.companyName || item.user?.firstName || '',
          specialties: item.skills || [],
          moduleCount: item._moduleCount || 0,
        } as DeveloperResult;
      case 'module':
        return {
          ...base,
          type: 'module',
          logo: item.logo,
          developer: item.developer?.companyName || '',
          version: item.version || '',
          price: Number(item.price) || 0,
          installCount: item.totalInstalls || 0,
        } as ModuleResult;
      default:
        return {
          ...base,
          type: 'business',
          slug: item.slug,
          category: '',
          description: '',
          badges: [],
          modules: [],
        } as BusinessResult;
    }
  }

  // --- State ---
  const { filters, updateFilters, clearFilters, setFilters } = usePersistentFilters(
    {
      type: '',
      proximity: '',
      country: initialCountry,
      city: '',
      category: '',
      subCategory: '',
      minRating: 0,
      status: [],
      price: '',
      priceMin: undefined,
      priceMax: undefined,
      availability: [],
    },
    initialCountry
  );

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Sync debounced query to URL search params
  useEffect(() => {
    const current = searchParams.get('q') || '';
    if (debouncedQuery !== current) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedQuery) {
        params.set('q', debouncedQuery);
      } else {
        params.delete('q');
      }
      const newUrl = params.toString() ? `/marketplace?${params.toString()}` : '/marketplace';
      window.history.replaceState(null, '', newUrl);
    }
  }, [debouncedQuery, searchParams]);

  const [cursor, setCursor] = useState<string | null>(null);
  const [sort, setSort] = useState('popular');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showMap, setShowMap] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const { items: recentlyViewed, trackView, clearHistory } = useRecentlyViewed();
  const { searches: recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches();

  const [showMobileSort, setShowMobileSort] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [accumulatedResults, setAccumulatedResults] = useState<ResultItem[]>([]);
  const [accumulatedTotal, setAccumulatedTotal] = useState(0);
  const [accumulatedTotalPages, setAccumulatedTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const nextCursorRef = useRef<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const results = accumulatedResults;
  const isSearching =
    !!debouncedQuery ||
    filters.type !== '' ||
    activeCategory !== '' ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined ||
    filters.country !== '' ||
    filters.city !== '' ||
    filters.minRating > 0 ||
    filters.status.length > 0 ||
    filters.availability.length > 0;
  const handleToggleSelect = (item: ResultItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const key = `${item.type}-${item.id}`;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const handleClearSelection = () => setSelectedIds(new Set());
  const addMultipleToCart = useCartStore((s) => s.addMultipleItems);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.type !== '' ||
      filters.proximity !== '' ||
      filters.country !== '' ||
      filters.city !== '' ||
      filters.category !== '' ||
      filters.subCategory !== '' ||
      filters.minRating > 0 ||
      filters.status.length > 0 ||
      filters.price !== '' ||
      filters.priceMin !== undefined ||
      filters.priceMax !== undefined ||
      filters.availability.length > 0
    );
  }, [filters]);
  const perPage = 12;

  // --- Effects: Geolocation ---
  useEffect(() => {
    if ('geolocation' in navigator && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        undefined,
        { timeout: 5000, enableHighAccuracy: false }
      );
    }
  }, [userLocation]);

  // --- Effects: Autocomplete suggestions ---
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoadingSuggestions(true);
    apiClient
      .searchMarketplace({ q: searchQuery, limit: 5 })
      .then((res) => {
        if (!cancelled) {
          const items: ApiSearchItem[] = res.data.data || [];
          const names = items.map((i: ApiSearchItem) => i.name || i.title || '').filter(Boolean);
          setSuggestions(names.slice(0, 6));
          setLoadingSuggestions(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestions([]);
          setLoadingSuggestions(false);
        }
      });
    return () => {
      cancelled = true;
    };
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

  const parsedQuery = useMemo(() => parseSearchQuery(debouncedQuery), [debouncedQuery]);

  const searchQueryParams = useMemo(() => {
    const params: Record<string, unknown> = { sort, limit: perPage };
    if (cursor) params.cursor = cursor;
    if (debouncedQuery) params.q = debouncedQuery;
    if (parsedQuery.phrases.length > 0) params.phrases = parsedQuery.phrases;
    if (parsedQuery.excluded.length > 0) params.excluded = parsedQuery.excluded;
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
  }, [debouncedQuery, parsedQuery, filters, sort, cursor, activeCategory, userLocation]);

  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError,
  } = useQuery({
    queryKey: ['marketplace-search', searchQueryParams],
    queryFn: async () => {
      const res = await apiClient.searchMarketplace(searchQueryParams as any);
      const pagination =
        (res.data as { pagination?: { total?: number; totalPages?: number; nextCursor?: string } })
          ?.pagination || {};
      return {
        items: res.data.data || [],
        total: pagination.total || 0,
        totalPages: pagination.totalPages || 1,
        nextCursor: pagination.nextCursor as string | undefined,
      };
    },
    enabled: isSearching,
  });

  // --- Effects: Accumulate results for infinite scroll ---
  useEffect(() => {
    if (!searchResults) return;
    nextCursorRef.current = searchResults.nextCursor || null;
    const firstPage = !cursor;
    if (firstPage) {
      setAccumulatedResults(searchResults.items);
      setAccumulatedTotal(searchResults.total);
      setAccumulatedTotalPages(searchResults.totalPages);
    } else {
      setAccumulatedResults((prev) => {
        const existingIds = new Set(prev.map((r: ResultItem) => `${r.type}-${r.id}`));
        const newItems = searchResults.items.filter(
          (r: ResultItem) => !existingIds.has(`${r.type}-${r.id}`)
        );
        return [...prev, ...newItems];
      });
    }
    setIsLoadingMore(false);
  }, [searchResults, cursor]);

  // --- Effects: Reset accumulated results when filters change ---
  useEffect(() => {
    setAccumulatedResults([]);
    setAccumulatedTotal(0);
    setAccumulatedTotalPages(1);
    setCursor(null);
  }, [debouncedQuery, filters, sort, activeCategory, userLocation]);

  // --- Derived values ---
  const totalPages = accumulatedTotalPages;
  const trendingBusinesses: PremiumBusiness[] = useMemo(() => {
    if (!trending) return [];
    return (trending.topBusinesses || []).map((b: ApiSearchItem) => ({
      id: b.id,
      type: 'business' as const,
      name: b.name || '',
      slug: b.slug,
      rating: b.rating || 0,
      reviewCount: b.reviewCount || 0,
      image: b.logo || b.images?.[0] || '',
      logo: b.logo,
      city: b.city,
      country: b.country,
      category: b.category,
      description: b.shortDescription || b.description,
      badges: [
        ...(b.isVerified ? ['verified' as const] : []),
        ...(b.isPremium ? ['premium' as const] : []),
        ...(b.isTopSeller ? ['top_seller' as const] : []),
      ],
      modules: (b.modules || []).slice(0, 4),
      afriScore: b.afriScore,
      isVerified: b.isVerified,
      isPremium: b.isPremium,
      isTopSeller: b.isTopSeller,
    }));
  }, [trending]);

  const trendingItems: ResultItem[] = useMemo(() => {
    if (!trending) return [];
    const items: ResultItem[] = [];
    (trending.topBusinesses || []).forEach((b: ApiSearchItem) =>
      items.push(mapItem({ ...b, _type: 'business' }))
    );
    (trending.topProducts || []).forEach((p: ApiSearchItem) =>
      items.push(mapItem({ ...p, _type: 'product', business: { name: p.business?.name } }))
    );
    (trending.topServices || []).forEach((s: ApiSearchItem) =>
      items.push(mapItem({ ...s, _type: 'service', business: { name: s.business?.name } }))
    );
    (trending.topEvents || []).forEach((e: ApiSearchItem) =>
      items.push(mapItem({ ...e, _type: 'event', business: { name: e.business?.name } }))
    );
    (trending.topRooms || []).forEach((r: ApiSearchItem) =>
      items.push(mapItem({ ...r, _type: 'room', business: { name: r.business?.name } }))
    );
    (trending.topTrainings || []).forEach((t: ApiSearchItem) =>
      items.push(mapItem({ ...t, _type: 'training', business: { name: t.business?.name } }))
    );
    return items;
  }, [trending]);

  const displayItems = isSearching ? results : trendingItems;

  const handleBulkAddToCart = useCallback(() => {
    const cartItems: CartItem[] = [];
    const itemsToAdd = displayItems;
    for (const r of itemsToAdd) {
      const key = `${r.type}-${r.id}`;
      if (!selectedIds.has(key)) continue;
      if (r.type === 'product') {
        const p = r as ProductResult;
        cartItems.push({
          id: p.id,
          productId: p.id,
          name: p.name,
          price: p.promoPrice || p.price,
          currency: 'FCFA',
          quantity: 1,
          image: p.image,
          businessId: p.businessId || p.businessSlug,
          businessName: p.businessName,
        });
      } else if (r.type === 'service') {
        const s = r as ServiceResult;
        cartItems.push({
          id: s.id,
          productId: s.id,
          name: s.name,
          price: s.price,
          currency: 'FCFA',
          quantity: 1,
          image: s.image,
          businessId: s.businessSlug || s.id,
          businessName: s.businessName,
        });
      }
    }
    if (cartItems.length > 0) {
      addMultipleToCart(cartItems);
      setSelectedIds(new Set());
    }
  }, [displayItems, selectedIds, addMultipleToCart]);

  // --- For You Recommendations ---
  const forYouItems: ResultItem[] = useMemo(() => {
    if (isSearching || !trending) return [];

    // Get recently viewed categories for personalized recommendations
    const viewedCategories = new Set(recentlyViewed.map((v) => v.category).filter(Boolean));
    const viewedTypes = new Set(recentlyViewed.map((v) => v.type).filter(Boolean));

    // Score each trending item based on relevance to user history
    const scored = trendingItems.map((item, idx) => {
      let score = 0;
      // Boost if matching a previously viewed category
      if ('category' in item && viewedCategories.has((item as BusinessResult).category)) score += 3;
      // Boost if matching a previously viewed type
      if (viewedTypes.has(item.type)) score += 2;
      // Boost items from same city as recently viewed
      if (recentlyViewed.some((rv) => rv.city && item.city === rv.city)) score += 1;
      // Add slight offset based on index for diversity
      score += (idx % 5) * 0.1;
      return { item, score };
    });

    // Sort by score descending, take top items
    const sorted = scored.sort((a, b) => b.score - a.score);
    return sorted.slice(0, Math.min(8, trendingItems.length)).map((s) => s.item);
  }, [trendingItems, isSearching, recentlyViewed]);

  const mapBusinesses = useMemo(() => {
    return displayItems
      .filter((item: ResultItem) => item.type === 'business')
      .map((item: ResultItem) => {
        const business = item as BusinessResult;
        return {
          id: business.id,
          name: business.name,
          slug: business.slug || business.businessSlug,
          latitude: 0,
          longitude: 0,
          logo: business.logo || business.image,
          rating: business.rating,
          type: business.type,
          city: business.city,
        };
      });
  }, [displayItems]);

  // --- Effects: Scroll to top on reset ---
  useEffect(() => {
    if (!cursor && isSearching) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [cursor, isSearching]);

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
  const handleCategorySelect = useCallback((id: string) => {
    setActiveCategory(id);
    setCursor(null);
  }, []);
  const handleSearchChange = useCallback((v: string) => {
    setSearchQuery(v);
    setCursor(null);
  }, []);
  const handleSearchFocus = useCallback(() => {
    setShowSuggestions(true);
  }, []);
  const handleSearchBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);
  const handleSelectSuggestion = useCallback(
    (v: string) => {
      setSearchQuery(v);
      addSearch(v);
      setShowSuggestions(false);
      setCursor(null);
    },
    [addSearch]
  );

  // --- Callbacks: View/Sort ---
  const handleViewChange = useCallback((newView: 'grid' | 'list') => {
    setView(newView);
    setShowMap(false);
  }, []);
  const handleSortChange = useCallback((newSort: string) => {
    setSort(newSort);
    setCursor(null);
  }, []);

  // --- Callbacks: Load more ---
  const handleLoadMore = useCallback(() => {
    if (!nextCursorRef.current) return;
    setIsLoadingMore(true);
    setCursor(nextCursorRef.current);
  }, []);

  // --- Callbacks: Compare toggle from ResultsGrid ---
  const handleToggleCompare = useCallback(
    (item: ResultItem) => {
      const biz = item.type === 'business' ? (item as BusinessResult) : null;
      handleAddToComparison({
        id: item.id,
        name: item.name,
        slug: item.businessSlug || item.id,
        type: item.type,
        category: biz?.category ?? undefined,
        city: item.city,
        country: item.country,
        rating: item.rating,
        reviewCount: item.reviewCount,
        isVerified: biz?.badges?.includes('verified'),
        isPremium: biz?.badges?.includes('premium'),
        isTopSeller: biz?.badges?.includes('top_seller'),
        description: biz?.description,
        modules: biz?.modules,
        logo: item.image,
        distance: item.distance,
      });
    },
    [handleAddToComparison]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <EnhancedHero
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchFocus={handleSearchFocus}
        onSearchBlur={handleSearchBlur}
        suggestionsVisible={showSuggestions}
        onSelectSuggestion={handleSelectSuggestion}
        suggestions={suggestions}
        loadingSuggestions={loadingSuggestions}
        autocompleteRef={autocompleteRef}
      />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <AdSlot page="MARKETPLACE" position="TOP_BANNER" />
        <QuickCategories active={activeCategory} onSelect={handleCategorySelect} />

        {/* Recently Viewed */}
        {!isSearching && <RecentlyViewed items={recentlyViewed} onClear={clearHistory} />}

        {/* Stories ring */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand" />
              Stories
            </h2>
            <Link
              href="/dashboard/stories"
              className="text-sm font-medium text-brand hover:text-brand-700 dark:hover:text-brand-400 flex items-center gap-1"
            >
              Voir tout
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <StoryRing />
          </div>
        </section>

        {!isSearching && (
          <TrendingSection items={trendingBusinesses} isLoading={trendingLoading && !trending} />
        )}
        {!isSearching && forYouItems.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Pour vous</h2>
              <button
                onClick={() => setActiveCategory('business')}
                className="text-sm font-medium text-brand hover:text-brand-700 dark:hover:text-brand-400"
              >
                Voir tout
              </button>
            </div>
            <ResultsGrid
              items={forYouItems}
              view={view}
              isLoading={false}
              error={null}
              isSearching={false}
              comparisonItems={comparisonItems}
              onToggleCompare={handleToggleCompare}
              hasMore={false}
              isLoadingMore={false}
              onLoadMore={() => {}}
            />
          </section>
        )}

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
              filters={filters}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />

            <div className="flex gap-6">
              <FilterSidebar
                filters={filters}
                onChange={(f) => {
                  setFilters(f);
                  setCursor(null);
                }}
              />

              {showMobileFilters && (
                <div className="fixed inset-0 z-50 lg:hidden">
                  <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={() => setShowMobileFilters(false)}
                  />
                  <div className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto rounded-t-2xl animate-slide-up p-4">
                    <div className="flex items-center justify-center mb-2 -mt-1">
                      <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    </div>
                    <FilterSidebar
                      filters={filters}
                      onChange={(f) => {
                        setFilters(f);
                        setCursor(null);
                      }}
                      onClose={() => setShowMobileFilters(false)}
                      mobile
                    />
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
                      onBusinessClick={(slug: any) => router.push(`/business/${slug}`)}
                    />
                  ) : (
                    <div className="text-center py-16">
                      <MapPin className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Aucune localisation
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Les résultats actuels n'ont pas de coordonnées géographiques.
                      </p>
                    </div>
                  )
                ) : (
                  <>
                    {selectedIds.size > 0 && (
                      <div className="flex items-center justify-between px-4 py-2.5 mb-3 bg-brand/5 border border-brand/20 rounded-xl">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleClearSelection}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={handleBulkAddToCart}
                            className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-700 transition-colors inline-flex items-center gap-1.5"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Ajouter au panier
                          </button>
                        </div>
                      </div>
                    )}
                    <AdSlot page="MARKETPLACE" position="SPONSORED_RESULT" />
                    <ResultsGrid
                      items={displayItems}
                      view={view}
                      isLoading={searchLoading}
                      error={searchError as Error | null}
                      isSearching={isSearching}
                      comparisonItems={comparisonItems}
                      onToggleCompare={handleToggleCompare}
                      hasMore={
                        isSearching &&
                        (!!nextCursorRef.current || accumulatedResults.length < accumulatedTotal)
                      }
                      isLoadingMore={isLoadingMore}
                      onLoadMore={handleLoadMore}
                      debouncedQuery={debouncedQuery}
                      clearFilters={clearFilters}
                      hasActiveFilters={hasActiveFilters}
                      selectedIds={selectedIds}
                      onToggleSelect={handleToggleSelect}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:block space-y-6">
            <TopBusinessSection
              items={trendingBusinesses}
              isLoading={trendingLoading && !trending}
            />
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
