'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Leaf, TrendingUp, Shield, CreditCard, Truck, Star, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

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

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K+`;
  return `${n}+`;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Fetch real stats from API
  const { data: stats } = useQuery({
    queryKey: ['marketplace-stats'],
    queryFn: async () => {
      const res = await apiClient.getMarketplaceStats();
      return res.data.data;
    },
    staleTime: 300000,
  });

  const HERO_STATS = stats ? [
    { value: formatNumber(stats.businesses), label: 'Business actifs' },
    { value: formatNumber(stats.products), label: 'Produits' },
    { value: formatNumber(stats.services), label: 'Services' },
    { value: formatNumber(stats.events), label: 'Événements' },
    { value: `${stats.averageRating}/5`, label: 'Satisfaction' },
  ] : [
    { value: '---', label: 'Business actifs' },
    { value: '---', label: 'Produits' },
    { value: '---', label: 'Services' },
    { value: '---', label: 'Événements' },
    { value: '---', label: 'Satisfaction' },
  ];

  return (
    <section className="relative bg-gradient-to-br from-emerald-900 via-brand to-emerald-700 overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-300/15 rounded-full blur-3xl -translate-x-1/4 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-emerald-100 text-xs font-medium mb-6 border border-white/10">
              <Sparkles className="h-3.5 w-3.5" />
              Marketplace AfriBiz
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
              Découvrez et connectez-vous aux{' '}
              <span className="text-emerald-200">meilleurs business d&apos;Afrique</span>
            </h1>

            <p className="text-emerald-100/80 max-w-lg mx-auto lg:mx-0 mb-8 text-base sm:text-lg">
              Trouvez facilement des produits, services, et opportunités près de chez vous.
            </p>

            <div className="relative max-w-xl mx-auto lg:mx-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={onSearchFocus}
                  onBlur={() => setTimeout(() => _onSearchBlur?.(), 200)}
                  placeholder="Rechercher un business, produit, service, ville..."
                  className="w-full pl-12 pr-10 py-4 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 shadow-lg shadow-black/5 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 text-base"
                />
                {searchQuery && (
                  <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>

              {(suggestionsVisible && mounted) && (
                <div ref={autocompleteRef as React.Ref<HTMLDivElement>} className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-40 overflow-hidden">
                  {!searchQuery ? (
                    <>
                      <div className="px-4 py-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">Suggestions</div>
                      {SUGGESTIONS.map((s) => (
                        <button key={s.label} onClick={() => onSelectSuggestion(s.label)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand transition-colors text-left">
                          <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                          {s.label}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">Résultats suggérés</div>
                      {loadingSuggestions && (
                        <div className="flex items-center justify-center py-4">
                          <div className="h-4 w-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {!loadingSuggestions && suggestions?.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">Aucune suggestion</div>
                      )}
                      {!loadingSuggestions && suggestions?.map((s) => (
                        <button key={s} onClick={() => onSelectSuggestion(s)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand transition-colors text-left">
                          <Search className="h-3.5 w-3.5 text-gray-400" />
                          {s}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-6 justify-center lg:justify-start">
              {ANIMATED_BADGES.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 text-xs font-medium text-white/90 animate-fade-in">
                    <Icon className="h-3.5 w-3.5" />
                    {badge.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {HERO_STATS.map((stat, i) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-5 text-center hover:bg-white/15 transition-all duration-300"
                  style={{ animationDelay: `${i * 100}ms` }}>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-emerald-200/80 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 mt-6 text-xs text-emerald-200/60">
              <div className="flex items-center gap-1"><Leaf className="h-3 w-3" /> Écosystème AfriBiz</div>
              <div className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Croissance</div>
              <div className="flex items-center gap-1"><Star className="h-3 w-3" /> Commerce</div>
            </div>
          </div>
        </div>

        <div className="lg:hidden mt-8">
          <div className="flex flex-wrap justify-center gap-3">
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 px-4 py-2 text-center min-w-[100px]">
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-emerald-200/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
