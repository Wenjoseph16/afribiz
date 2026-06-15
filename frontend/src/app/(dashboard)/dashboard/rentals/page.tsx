'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Car, Plus, Search, Grid3X3, List, Eye, Pencil,
  DollarSign, Package, CheckCircle2, XCircle, Loader,
  AlertTriangle, Zap, Sparkles,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useMyRentals, useRentalStats } from '@/features/hooks';

interface RentalItem {
  id: string; name: string; description: string | null;
  price: number; unit: string | null; deposit: number | null;
  priceUnit: string; currency: string; images: string[];
  quantity: number; availableQty: number; isActive: boolean;
  sortOrder: number; createdAt: string;
}

type TabType = 'all' | 'active' | 'inactive';

export default function RentalsPage() {
  const { data: rentalsData, isLoading, error, refetch } = useMyRentals();
  const { data: statsData } = useRentalStats();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const allRentals: RentalItem[] = Array.isArray(rentalsData) ? rentalsData : (rentalsData?.rentals || rentalsData?.data || []);

  const stats = statsData || {
    total: allRentals.length,
    active: allRentals.filter(r => r.isActive).length,
    inactive: allRentals.filter(r => !r.isActive).length,
  };

  const filtered = useMemo(() => {
    let f = [...allRentals];
    switch (activeTab) {
      case 'active': f = f.filter(r => r.isActive); break;
      case 'inactive': f = f.filter(r => !r.isActive); break;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(r => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || r.unit?.toLowerCase().includes(q));
    }
    return f;
  }, [allRentals, activeTab, searchQuery]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Locations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez vos articles et équipements en location</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard/rentals/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouvel article</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard icon={<Package className="h-5 w-5" />} iconBg="bg-brand-50" iconColor="text-brand" label="Total" value={stats.total} />
        <StatsCard icon={<CheckCircle2 className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Disponibles" value={stats.active} />
        <StatsCard icon={<XCircle className="h-5 w-5" />} iconBg="bg-gray-50" iconColor="text-gray-600" label="Indisponibles" value={stats.inactive} />
      </div>

      {/* Suggestions intelligentes */}
      {allRentals.length > 0 && (() => {
        const active = allRentals.filter(r => r.isActive);
        const lowStock = allRentals.filter(r => r.isActive && r.availableQty < r.quantity && r.availableQty <= 2);
        const inactive = allRentals.filter(r => !r.isActive);
        const highDemand = allRentals.filter(r => r.isActive && r.availableQty < r.quantity / 2);

        const suggestions = [
          active.length > 0 && {
            type: 'active', icon: CheckCircle2,
            title: `${active.length} article${active.length > 1 ? 's' : ''} disponible${active.length > 1 ? 's' : ''}`,
            desc: 'Prêts à être loués par vos clients',
            color: 'emerald',
          },
          highDemand.length > 0 && {
            type: 'high_demand', icon: Zap,
            title: `${highDemand.length} article${highDemand.length > 1 ? 's' : ''} en haute demande`,
            desc: 'Plus de 50% du stock déjà réservé',
            color: 'purple',
          },
          lowStock.length > 0 && {
            type: 'low_stock', icon: AlertTriangle,
            title: `${lowStock.length} article${lowStock.length > 1 ? 's' : ''} en stock limité`,
            desc: '≤ 2 exemplaires disponibles — envisagez un réapprovisionnement',
            color: 'amber',
          },
          inactive.length > 0 && {
            type: 'inactive', icon: Sparkles,
            title: `${inactive.length} article${inactive.length > 1 ? 's' : ''} inactif${inactive.length > 1 ? 's' : ''}`,
            desc: 'Réactivez les articles qui peuvent être loués',
            color: 'blue',
          },
        ].filter(Boolean);

        if (suggestions.length === 0) return null;

        const colorMap: Record<string, string> = {
          emerald: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10',
          purple: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
          amber: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
          blue: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
        };

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s: any, i) => (
              <Link key={i} href={s.link || '/dashboard/rentals'}
                className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${colorMap[s.color]} border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all duration-200`}>
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm shrink-0">
                  <s.icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        );
      })()}


      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {(['all', 'active', 'inactive'] as TabType[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>
              {tab === 'all' ? 'Tous' : tab === 'active' ? 'Disponibles' : 'Indisponibles'}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher un article..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
          </div>
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('grid')}
              className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-brand text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500')}>
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={cn('p-2 transition-colors', viewMode === 'list' ? 'bg-brand text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500')}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Car className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucun article trouvé</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'Essayez une autre recherche' : 'Ajoutez votre premier article en location'}
          </p>
          <Link href="/dashboard/rentals/new"><Button><Plus className="h-4 w-4 mr-1.5" />Nouvel article</Button></Link>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((rental) => (
            <RentalCard key={rental.id} rental={rental} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Article</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Unité</th>
                <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="p-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((rental) => (
                <RentalRow key={rental.id} rental={rental} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getBadge(rental: RentalItem): { label: string; class: string } | null {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const isHighDemand = rental.isActive && rental.availableQty < rental.quantity / 2;
  const isLowStock = rental.isActive && rental.availableQty <= 2 && rental.availableQty < rental.quantity;
  const isNew = rental.createdAt && new Date(rental.createdAt) > thirtyDaysAgo;
  if (isHighDemand) return { label: '📈 Haute demande', class: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300' };
  if (isLowStock) return { label: '⚠️ Stock limité', class: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300' };
  if (isNew) return { label: '🆕 Nouveau', class: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300' };
  return null;
}

function RentalCard({ rental }: { rental: RentalItem }) {
  const badge = getBadge(rental);
  return (
    <Link href={`/dashboard/rentals/${rental.id}`}
      className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand/30 hover:shadow-sm transition-all duration-200">
      <div className="aspect-video bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-900/20 dark:to-emerald-900/20 flex items-center justify-center relative">
        <Car className="h-12 w-12 text-brand/30 dark:text-brand-400/30" />
        {rental.images?.[0] && (
          <Image src={rental.images[0]} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
        )}
        {badge && (
          <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/90 dark:bg-gray-900/90 shadow-sm">{badge.label}</span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{rental.name}</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <DollarSign className="h-3.5 w-3.5" />
          {Number(rental.price).toLocaleString()} {rental.currency} / {rental.priceUnit}
        </div>
        {rental.deposit && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Package className="h-3.5 w-3.5" />
            Caution : {Number(rental.deposit).toLocaleString()} {rental.currency}
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Package className="h-3.5 w-3.5" />
            {rental.availableQty}/{rental.quantity} dispo.
          </div>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
            rental.isActive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-gray-500 bg-gray-100 dark:bg-gray-800'
          )}>
            {rental.isActive ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function RentalRow({ rental }: { rental: RentalItem }) {
  const badge = getBadge(rental);
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
            <Car className="h-5 w-5 text-brand" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{rental.name}</p>
            <p className="text-xs text-gray-500">{rental.unit || '-'}</p>
            {badge && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 inline-block bg-gray-100 dark:bg-gray-700">{badge.label}</span>}
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {Number(rental.price).toLocaleString()} {rental.currency}
        </span>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">/{rental.priceUnit}</span>
      </td>
      <td className="p-4 text-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">{rental.availableQty}/{rental.quantity}</span>
      </td>
      <td className="p-4 text-center">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
          rental.isActive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-gray-500 bg-gray-100 dark:bg-gray-800'
        )}>
          {rental.isActive ? 'Actif' : 'Inactif'}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/dashboard/rentals/${rental.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors">
            <Eye className="h-4 w-4" />
          </Link>
          <Link href={`/dashboard/rentals/${rental.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors">
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}
