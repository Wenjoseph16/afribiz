'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Leaf,
  TrendingUp,
  Shield,
  CreditCard,
  Truck,
  Star,
  Sparkles,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';

const ANIMATED_BADGES = [
  { icon: Shield, label: 'Business vérifiés', color: 'text-emerald-200' },
  { icon: CreditCard, label: 'Paiement sécurisé', color: 'text-blue-200' },
  { icon: Truck, label: 'Livraison disponible', color: 'text-amber-200' },
  { icon: Star, label: 'Escrow disponible', color: 'text-purple-200' },
];

const SUGGESTIONS = [
  { label: 'Restaurants', type: 'category' },
  { label: 'Menus & Plats', type: 'category' },
  { label: 'Business', type: 'category' },
  { label: 'Services', type: 'category' },
  { label: 'Produits', type: 'category' },
  { label: 'Événements', type: 'category' },
  { label: 'Modules développeurs', type: 'category' },
  { label: 'Hôtels & Hébergement', type: 'category' },
];

const PARTICLE_COUNT = 12;

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K+`;
  return `${n}+`;
}

function FloatingParticle({ index }: { index: number }) {
  const size = 2 + (index % 3) * 2;
  const x = (index * 31) % 100;
  const delay = index * 0.7;
  const duration = 6 + (index % 4) * 2;

  return (
    <div
      className="absolute rounded-full bg-white/10"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        bottom: '-10px',
        animation: `float-up ${duration}s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

export default function EnhancedHero({
  searchQuery,
  onSearchChange,
  onSearchFocus,
  onSearchBlur: _onSearchBlur,
  suggestionsVisible,
  onSelectSuggestion,
  suggestions,
  loadingSuggestions,
  autocompleteRef,
}: {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  suggestionsVisible: boolean;
  onSelectSuggestion: (v: string) => void;
  suggestions?: string[];
  loadingSuggestions?: boolean;
  autocompleteRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inputRef.current?.blur();
  };
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: stats } = useQuery({
    queryKey: ['marketplace-stats'],
    queryFn: async () => {
      const res = await apiClient.getMarketplaceStats();
      return res.data.data;
    },
    staleTime: 300000,
  });

  const HERO_STATS = stats
    ? [
        { value: formatNumber(stats.businesses), label: 'Business actifs' },
        { value: formatNumber(stats.products), label: 'Produits' },
        { value: formatNumber(stats.services), label: 'Services' },
        { value: formatNumber(stats.events), label: 'Événements' },
        { value: `${stats.averageRating}/5`, label: 'Satisfaction' },
      ]
    : null;

  return (
    <section className="relative bg-gradient-to-br from-emerald-900 via-brand to-emerald-700 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0">
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-300/15 rounded-full blur-3xl -translate-x-1/4 translate-y-1/2 animate-pulse"
          style={{ animationDuration: '5s', animationDelay: '1s' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />
        {/* Floating particles */}
        {mounted &&
          Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <FloatingParticle key={i} index={i} />
          ))}
      </div>

      <style>{`
        .animate-slide-up-fade {
          animation: slide-up-fade 0.6s ease-out forwards;
        }
      `}</style>

      <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left column */}
          <div className="text-center lg:text-left">
            {mounted && (
              <>
                {/* Badge with entrance animation */}
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-emerald-100 text-xs font-medium mb-6 border border-white/10 animate-slide-up-fade"
                  style={{ animationDelay: '0ms' }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Marketplace AfriBiz
                </div>

                {/* Title with entrance animation */}
                <h1
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight tracking-tight animate-slide-up-fade"
                  style={{ animationDelay: '100ms' }}
                >
                  Découvrez et connectez-vous aux{' '}
                  <span className="text-emerald-200 relative">
                    meilleurs business d&apos;Afrique
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-400/40 rounded-full" />
                  </span>
                </h1>

                {/* Subtitle */}
                <p
                  className="text-emerald-100/80 max-w-lg mx-auto lg:mx-0 mb-8 text-base sm:text-lg animate-slide-up-fade"
                  style={{ animationDelay: '200ms' }}
                >
                  Trouvez facilement des produits, services, et opportunités près de chez vous.
                </p>
              </>
            )}

            {/* Search with entrance animation */}
            <div
              className={cn(
                'relative max-w-xl mx-auto lg:mx-0 transition-all duration-300',
                mounted ? 'animate-slide-up-fade opacity-0' : 'opacity-0',
                searchFocused ? 'scale-[1.02]' : 'scale-100'
              )}
              style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
            >
              <form onSubmit={handleSubmit} role="search" aria-label="Recherche marketplace">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    ref={inputRef}
                    id="marketplace-search"
                    name="search"
                    type="text"
                    autoComplete="off"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={() => {
                      setSearchFocused(true);
                      onSearchFocus?.();
                    }}
                    onBlur={() => {
                      setSearchFocused(false);
                      setTimeout(() => _onSearchBlur?.(), 200);
                    }}
                    placeholder="Rechercher un business, produit, service, ville..."
                    aria-label="Rechercher dans le marketplace"
                    aria-autocomplete="list"
                    aria-controls={suggestionsVisible ? 'search-suggestions' : undefined}
                    aria-expanded={suggestionsVisible}
                    aria-activedescendant={undefined}
                    role="combobox"
                    className={cn(
                      'w-full pl-12 pr-10 py-4 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 shadow-lg shadow-black/5 text-base transition-all duration-300',
                      searchFocused
                        ? 'outline-none ring-4 ring-emerald-300/40 ring-offset-2 ring-offset-emerald-900/50'
                        : 'focus:outline-none focus:ring-2 focus:ring-emerald-300/50'
                    )}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      aria-label="Effacer la recherche"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all hover:scale-110 active:scale-95"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </form>

              {suggestionsVisible && mounted && (
                <div
                  id="search-suggestions"
                  ref={autocompleteRef as React.Ref<HTMLDivElement>}
                  role="listbox"
                  aria-label="Suggestions de recherche"
                  className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-40 overflow-hidden animate-slide-up-fade"
                  style={{ animationDuration: '0.3s' }}
                >
                  {!searchQuery ? (
                    <>
                      <div className="px-4 py-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">
                        Suggestions
                      </div>
                      {SUGGESTIONS.map((s, idx) => (
                        <button
                          key={s.label}
                          role="option"
                          aria-selected={false}
                          id={`suggestion-${idx}`}
                          onClick={() => onSelectSuggestion(s.label)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand transition-colors text-left"
                        >
                          <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                          {s.label}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">
                        Résultats suggérés
                      </div>
                      {loadingSuggestions && (
                        <div className="flex items-center justify-center py-4" role="status">
                          <div className="h-4 w-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                          <span className="sr-only">Chargement des suggestions...</span>
                        </div>
                      )}
                      {!loadingSuggestions && suggestions?.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                          Aucune suggestion
                        </div>
                      )}
                      {!loadingSuggestions &&
                        suggestions?.map((s, idx) => (
                          <button
                            key={s}
                            role="option"
                            aria-selected={false}
                            id={`search-suggestion-${idx}`}
                            onClick={() => onSelectSuggestion(s)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand transition-colors text-left"
                          >
                            <Search className="h-3.5 w-3.5 text-gray-400" />
                            {s}
                          </button>
                        ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Badges with staggered entrance */}
            <div
              className="flex flex-wrap gap-2 mt-6 justify-center lg:justify-start"
              style={{ opacity: mounted ? 1 : 0 }}
            >
              {ANIMATED_BADGES.map((badge, i) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.label}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 text-xs font-medium text-white/90',
                      mounted && 'animate-slide-up-fade'
                    )}
                    style={{
                      animationDelay: `${400 + i * 80}ms`,
                      animationFillMode: 'forwards',
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {badge.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column: Stats */}
          <div className="hidden lg:block">
            <div
              className="grid grid-cols-2 gap-4 max-w-md mx-auto"
              style={{ opacity: mounted ? 1 : 0 }}
            >
              {HERO_STATS
                ? HERO_STATS.map((stat, i) => (
                    <div
                      key={stat.label}
                      className={cn(
                        'bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-5 text-center transition-all duration-300',
                        mounted && 'animate-slide-up-fade'
                      )}
                      style={{
                        animationDelay: `${500 + i * 100}ms`,
                        animationFillMode: 'forwards',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = '';
                      }}
                    >
                      <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-emerald-200/80 mt-1">{stat.label}</p>
                    </div>
                  ))
                : Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-5 text-center animate-pulse"
                    >
                      <div className="h-8 w-16 bg-white/20 rounded mx-auto" />
                      <div className="h-3 w-20 bg-white/10 rounded mx-auto mt-2" />
                    </div>
                  ))}
            </div>

            <div
              className="flex items-center justify-center gap-4 mt-6 text-xs text-emerald-200/60"
              style={{
                opacity: mounted ? 1 : 0,
                transition: 'opacity 0.6s ease-out',
                transitionDelay: '900ms',
              }}
            >
              <div className="flex items-center gap-1 hover:text-emerald-200/80 transition-colors">
                <Leaf className="h-3 w-3" /> Écosystème AfriBiz
              </div>
              <div className="flex items-center gap-1 hover:text-emerald-200/80 transition-colors">
                <TrendingUp className="h-3 w-3" /> Croissance
              </div>
              <div className="flex items-center gap-1 hover:text-emerald-200/80 transition-colors">
                <Star className="h-3 w-3" /> Commerce
              </div>
            </div>
          </div>
        </div>

        {/* Mobile stats */}
        <div
          className="lg:hidden mt-8"
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
            transitionDelay: '600ms',
          }}
        >
          <div className="flex flex-wrap justify-center gap-3">
            {HERO_STATS
              ? HERO_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 px-4 py-2 text-center min-w-[100px]"
                  >
                    <p className="text-lg font-bold text-white">{stat.value}</p>
                    <p className="text-[10px] text-emerald-200/80">{stat.label}</p>
                  </div>
                ))
              : Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 px-4 py-2 text-center min-w-[100px] animate-pulse"
                  >
                    <div className="h-6 w-12 bg-white/20 rounded mx-auto" />
                    <div className="h-2 w-16 bg-white/10 rounded mx-auto mt-1" />
                  </div>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
