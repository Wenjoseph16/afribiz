'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, Code, Star, Download, Package, X,
  ChevronDown, ChevronRight, ArrowLeft, ArrowRight,
  Sparkles, Shield, Users,
  Grid3X3, List, SlidersHorizontal, ChevronLeft,
} from 'lucide-react';
import AdSlot from '@/components/ads/AdSlot';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import ResultCard from '@/components/marketplace/ResultCard';

const CATEGORIES = [
  { value: '', label: 'Toutes catégories', icon: Package },
  { value: 'ecommerce', label: 'E-commerce', icon: Package },
  { value: 'crm', label: 'CRM & Ventes', icon: Users },
  { value: 'finance', label: 'Finance & Compta', icon: Package },
  { value: 'marketing', label: 'Marketing', icon: Package },
  { value: 'productivite', label: 'Productivité', icon: Package },
  { value: 'communication', label: 'Communication', icon: Package },
  { value: 'data', label: 'Data & Analytics', icon: Package },
  { value: 'design', label: 'Design & UI', icon: Package },
  { value: 'securite', label: 'Sécurité', icon: Shield },
  { value: 'reseau', label: 'Réseau & Infrastructure', icon: Package },
  { value: 'ia', label: 'IA & Machine Learning', icon: Sparkles },
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Populaire' },
  { value: 'rating', label: 'Mieux noté' },
  { value: 'sales', label: 'Plus vendu' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'name', label: 'Nom A-Z' },
];

function ModuleCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        <div className="flex-1">
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-3 w-1/2 bg-gray-100 rounded mt-1" />
        </div>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-3 w-20 bg-gray-100 rounded" />
        <div className="h-3 w-16 bg-gray-100 rounded" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 bg-gray-200 rounded" />
        <div className="h-8 w-20 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

function TrendingSidebar({ modules }: { modules: any[] }) {
  const topRated = [...modules].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
  const mostInstalled = [...modules].sort((a, b) => (b.totalInstalls || 0) - (a.totalInstalls || 0)).slice(0, 5);

  return (
    <aside className="w-72 shrink-0 hidden xl:block">
      <div className="sticky top-24 space-y-6">
        {/* Stats Card */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-5 text-white">
          <Code className="h-8 w-8 text-purple-200 mb-3" />
          <h3 className="text-lg font-bold mb-1">Marketplace Modules</h3>
          <p className="text-sm text-purple-200/80 mb-4">
            {modules.length} modules disponibles
          </p>
          <Link
            href="/dashboard/developer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
          >
            <Users className="h-4 w-4" />
            Devenir développeur
          </Link>
        </div>

        {/* Top Rated */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              Top Notés
            </span>
          </h3>
          <div className="space-y-2">
            {topRated.map((mod, i) => (
              <Link
                key={mod.id}
                href={`/marketplace/${mod.slug}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 transition-colors group"
              >
                <span className={cn(
                  'text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                  i === 0 ? 'bg-amber-100 text-amber-700' :
                  i === 1 ? 'bg-gray-100 text-gray-600' :
                  i === 2 ? 'bg-orange-100 text-orange-700' :
                  'text-gray-300'
                )}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">{mod.name}</p>
                  <p className="text-[11px] text-gray-500">{mod.developer?.companyName || 'Développeur'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold text-gray-700">{(mod.rating || 0).toFixed(1)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Most Installed */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            <span className="flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5 text-brand" />
              Plus Installés
            </span>
          </h3>
          <div className="space-y-2">
            {mostInstalled.map((mod) => (
              <Link
                key={mod.id}
                href={`/marketplace/${mod.slug}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center shrink-0 border border-purple-100 relative">
                  {mod.logo ? (
                    <Image src={mod.logo ?? ''} alt="" fill className="object-cover rounded-lg" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                  ) : (
                    <Package className="h-4 w-4 text-purple-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">{mod.name}</p>
                  <p className="text-[11px] text-gray-500">{(mod.totalInstalls || 0).toLocaleString()} installs</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-purple-500 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Ad Space */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-5 text-white text-center">
          <Sparkles className="h-6 w-6 mx-auto mb-2 text-purple-200" />
          <p className="text-sm font-semibold">Publiez votre module</p>
          <p className="text-xs text-purple-200/80 mt-1">Rejoignez notre marketplace développeur</p>
          <Link
            href="/dashboard/developer"
            className="mt-3 inline-block text-xs font-semibold bg-white text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
          >
            Commencer
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default function ModulesMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sort, setSort] = useState('popular');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);

  const perPage = 12;

  const params = useMemo(() => ({
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
    sort,
    page,
    limit: perPage,
  }), [selectedCategory, searchQuery, sort, page]);

  const { data: result, isLoading } = useQuery({
    queryKey: ['marketplace-modules-list', params],
    queryFn: async () => {
      const res = await apiClient.getMarketplaceModules(params);
      return res.data.data as { data: any[]; total: number; page: number; totalPages: number };
    },
  });

  const modules = result?.data || [];
  const total = result?.total || 0;
  const totalPages = result?.totalPages || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-800 via-indigo-700 to-purple-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-300/15 rounded-full blur-3xl -translate-x-1/4 translate-y-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16 lg:py-20 text-center">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-purple-200/80 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour au marketplace général
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-purple-100 text-xs font-medium mb-6 border border-white/10">
            <Code className="h-3.5 w-3.5" />
            Marketplace Développeurs
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
            Modules & Extensions <br className="hidden sm:block" />
            <span className="text-purple-300">créés par la communauté</span>
          </h1>
          <p className="text-purple-100/80 max-w-2xl mx-auto mb-8 text-base sm:text-lg">
            Découvrez des modules développés par la communauté AfriBiz pour étendre les fonctionnalités de votre business.
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Rechercher un module, développeur, fonctionnalité..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-900 placeholder-gray-400 shadow-lg shadow-black/5 focus:outline-none focus:ring-2 focus:ring-purple-300/50 text-base"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Sponsored Ad */}
        <AdSlot page="MODULE_PAGE" position="TOP_BANNER" />

        {/* Category Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => { setSelectedCategory(''); setPage(1); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                !selectedCategory
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Package className="h-3.5 w-3.5" />
              Tous
            </button>
            {CATEGORIES.filter((c) => c.value).map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setSelectedCategory(cat.value); setPage(1); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  selectedCategory === cat.value
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{total}</span> module{total !== 1 ? 's' : ''}
              {searchQuery && <> pour &quot;{searchQuery}&quot;</>}
            </p>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setView('grid')}
                className={cn('p-1.5 rounded-md transition-colors', view === 'grid' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600')}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn('p-1.5 rounded-md transition-colors', view === 'list' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600')}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="xl:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMobileSort(!showMobileSort)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Tri : {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>
              {showMobileSort && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-30 py-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setShowMobileSort(false); }}
                      className={cn(
                        'block w-full text-left px-4 py-2 text-sm transition-colors',
                        sort === opt.value ? 'text-purple-600 font-medium bg-purple-50' : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Mobile Category Filter */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 xl:hidden">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
              <div className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Catégories</span>
                  <button onClick={() => setShowMobileFilters(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => { setSelectedCategory(''); setShowMobileFilters(false); }}
                    className={cn(
                      'block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                      !selectedCategory ? 'bg-purple-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    Toutes catégories
                  </button>
                  {CATEGORIES.filter((c) => c.value).map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => { setSelectedCategory(cat.value); setShowMobileFilters(false); }}
                      className={cn(
                        'block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                        selectedCategory === cat.value ? 'bg-purple-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ModuleCardSkeleton key={i} />
                ))}
              </div>
            ) : modules.length > 0 ? (
              <div className={cn(
                view === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4'
                  : 'space-y-3'
              )}>
                {modules.map((mod: any) => (
                  <ResultCard key={mod.id} item={{
                    id: mod.id,
                    type: 'module' as const,
                    name: mod.name,
                    rating: mod.rating || 0,
                    reviewCount: mod.reviewCount || 0,
                    city: '',
                    image: mod.logo || '',
                    developer: mod.developer?.companyName || 'Développeur',
                    version: mod.version || '1.0',
                    price: Number(mod.price) || 0,
                    installCount: mod.totalInstalls || 0,
                  }} view={view} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Search className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucun module trouvé</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `Aucun module ne correspond à "${searchQuery}". Essayez d'autres mots-clés.`
                    : 'Aucun module disponible dans cette catégorie pour le moment.'}
                </p>
                {(searchQuery || selectedCategory) && (
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory(''); }}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 pb-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Précédent
                </button>
                {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={cn(
                      'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                      page === i + 1 ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <TrendingSidebar modules={modules} />
        </div>
      </div>
    </div>
  );
}
