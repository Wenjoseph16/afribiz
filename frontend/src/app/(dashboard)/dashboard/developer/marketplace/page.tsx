'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, Star, Download, Package, X, ShoppingBag,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useMarketplaceModules, useDeveloperModules } from '@/features/developerHooks';
import { MODULE_CATEGORIES, PRICING_LABELS } from '@/types/developer';
import type { DeveloperModule } from '@/types/developer';

type TabKey = 'all' | 'mine';

export default function DeveloperMarketplacePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);

  const { data: allModules, isLoading: allLoading, error: allError, refetch: refetchAll } = useMarketplaceModules({
    category: category === '' ? undefined : category,
    search: search || undefined,
  });

  const { data: myModules, isLoading: myLoading } = useDeveloperModules('PUBLISHED');

  const allModuleList = useMemo(() => {
    if (!allModules) return [];
    return Array.isArray(allModules) ? allModules : (allModules.modules || allModules.data || []);
  }, [allModules]);

  const myModuleList = useMemo(() => {
    if (!myModules) return [];
    return Array.isArray(myModules) ? myModules : (myModules.modules || myModules.data || []);
  }, [myModules]);

  const filteredAll = useMemo(() => {
    let list = [...allModuleList];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m: DeveloperModule) =>
        m.name.toLowerCase().includes(q) ||
        (m.shortDescription || '').toLowerCase().includes(q) ||
        (m.category || '').toLowerCase().includes(q)
      );
    }
    if (category && category !== '') {
      list = list.filter((m: DeveloperModule) => m.category === category);
    }
    return list;
  }, [allModuleList, search, category]);

  const filteredMine = useMemo(() => {
    let list = [...myModuleList];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m: DeveloperModule) =>
        m.name.toLowerCase().includes(q) ||
        (m.shortDescription || '').toLowerCase().includes(q) ||
        (m.category || '').toLowerCase().includes(q)
      );
    }
    if (category && category !== '') {
      list = list.filter((m: DeveloperModule) => m.category === category);
    }
    return list;
  }, [myModuleList, search, category]);

  const currentList = activeTab === 'all' ? filteredAll : filteredMine;
  const isLoading = activeTab === 'all' ? allLoading : myLoading;
  const error = activeTab === 'all' ? allError : null;

  const renderStars = (rating: number) => {
    return (
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-3 w-3',
              star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'
            )}
          />
        ))}
      </span>
    );
  };

  if (error) return <ErrorState message={error.message} onRetry={refetchAll} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Marketplace"
        description="Découvrez tous les modules disponibles et retrouvez vos créations"
        breadcrumbs={[{ label: 'Développeur', href: '/dashboard/developer' }, { label: 'Marketplace' }]}
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1 w-fit">
        {[
          { key: 'all' as TabKey, label: 'Tous les modules' },
          { key: 'mine' as TabKey, label: 'Mes modules' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200',
              activeTab === tab.key
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white dark:bg-gray-800 dark:text-gray-100"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory(undefined)}
          className={cn(
            'px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-200',
            !category
              ? 'bg-brand text-white shadow-md shadow-brand/20'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          Toutes
        </button>
        {MODULE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(category === cat ? undefined : cat)}
            className={cn(
              'px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-200',
              category === cat
                ? 'bg-brand text-white shadow-md shadow-brand/20'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {currentList.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12" />}
          title="Aucun module trouvé"
          description={
            search || category
              ? 'Essayez de modifier vos filtres de recherche.'
              : activeTab === 'mine'
                ? "Vous n'avez pas encore publié de module."
                : 'Aucun module disponible pour le moment.'
          }
          action={
            activeTab === 'mine' && !search && !category ? (
              <Link href="/dashboard/developer/modules/publish">
                <Button variant="gradient">
                  <Package className="h-4 w-4" />
                  Publier un module
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentList.map((mod: DeveloperModule) => (
            <Card key={mod.id} hoverable padding="md">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/30 dark:to-purple-900/30 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                  {mod.logo ? (
                    <Image src={mod.logo ?? ''} alt={mod.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                  ) : (
                    <Package className="h-6 w-6 text-brand" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{mod.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {mod.developer?.developerName || 'Développeur'}
                  </p>
                  <Badge variant="brand" size="xs" className="mt-0.5">
                    {mod.category || 'Non catégorisé'}
                  </Badge>
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 min-h-[2rem]">
                {mod.shortDescription}
              </p>

              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span className="flex items-center gap-1">
                  {renderStars(mod.rating || 0)}
                  <span className="ml-0.5">({mod.reviewCount || 0})</span>
                </span>
                <span className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  {mod.totalInstalls || 0}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {mod.price ? `${mod.price.toLocaleString()} FCFA` : PRICING_LABELS[mod.pricingType] || 'Gratuit'}
                </span>
                <Link href={`/marketplace/${mod.slug || mod.id}`}>
                  <Button size="xs" variant="secondary">
                    <ShoppingBag className="h-3 w-3 mr-1" />
                    Voir
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
