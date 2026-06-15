'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Scissors, Plus, Search, Eye, Pencil, Clock, Users, Star, TrendingUp,
  Tag, Loader, Download, Grid3X3, List, CheckSquare,
  AlertTriangle, Lightbulb, Zap,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ErrorState } from '@/components/ui/ErrorState';
import { useMyServices, useServiceStats, useBulkDeleteServices, useBulkToggleServices } from '@/features/hooks';

type TabType = 'all' | 'active' | 'inactive' | 'promotional';

interface ServiceItem {
  id: string; name: string; shortDescription: string; category?: { name: string };
  price: number; currency: string; duration: number;
  isActive: boolean; isPromotional: boolean;
  promotionalPrice?: number; discountPercent?: number;
  bookingCount: number; rating: number; reviewCount: number; createdAt: string;
  locationType?: string; priceType?: string;
}

const TABS: { id: TabType; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'active', label: 'Actifs' },
  { id: 'inactive', label: 'Inactifs' },
  { id: 'promotional', label: 'Promotions' },
];

export default function ServicesPage() {
  const { data: servicesData, isLoading, error, refetch } = useMyServices();
  const { data: statsData } = useServiceStats();
  const bulkDelete = useBulkDeleteServices();
  const bulkToggle = useBulkToggleServices();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allServices: ServiceItem[] = useMemo(() => {
    const raw = Array.isArray(servicesData) ? servicesData : (servicesData?.services || servicesData?.data || []);
    return raw;
  }, [servicesData]);

  const isPopular = (s: ServiceItem) => (s.bookingCount || 0) >= 20;
  const isRecommended = (s: ServiceItem) => (s.rating || 0) >= 4.5 && (s.reviewCount || 0) >= 5;
  const isNewService = (s: ServiceItem) => {
    if (!s.createdAt) return false;
    return (Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 30;
  };

  const stats = useMemo(() => ({
    totalServices: allServices.length,
    activeServices: allServices.filter(s => s.isActive).length,
    totalBookings: allServices.reduce((a, s) => a + (s.bookingCount || 0), 0),
    totalReviews: allServices.reduce((a, s) => a + (s.reviewCount || 0), 0),
    avgRating: allServices.length > 0
      ? (allServices.reduce((a, s) => a + (s.rating || 0), 0) / allServices.length).toFixed(1)
      : '0.0',
  }), [allServices]);

  // Suggestions intelligentes
  const suggestions = useMemo(() => {
    const items: { type: 'no_bookings' | 'popular' | 'inactive' | 'promo'; title: string; description: string; icon: any; services: ServiceItem[] }[] = [];
    
    const noBookings = allServices.filter(s => s.isActive && (s.bookingCount || 0) === 0);
    if (noBookings.length > 0) {
      items.push({
        type: 'no_bookings',
        title: 'Services sans réservation',
        description: `${noBookings.length} service(s) n'ont jamais été réservés. Passez-les en promotion.`,
        icon: Lightbulb,
        services: noBookings.slice(0, 3),
      });
    }

    const popular = allServices.filter(s => s.isActive && isPopular(s));
    if (popular.length > 0) {
      items.push({
        type: 'popular',
        title: 'Services populaires',
        description: `${popular.length} service(s) très réservés. Mettez-les en avant !`,
        icon: TrendingUp,
        services: popular.slice(0, 3),
      });
    }

    const inactive = allServices.filter(s => !s.isActive);
    if (inactive.length > 0) {
      items.push({
        type: 'inactive',
        title: 'Services inactifs',
        description: `${inactive.length} service(s) sont désactivés. Souhaitez-vous les réactiver ?`,
        icon: AlertTriangle,
        services: inactive.slice(0, 3),
      });
    }

    const promo = allServices.filter(s => s.isActive && s.isPromotional);
    if (promo.length > 0) {
      items.push({
        type: 'promo',
        title: 'Promotions actives',
        description: `${promo.length} service(s) en promotion. Surveillez leurs performances.`,
        icon: Zap,
        services: promo.slice(0, 3),
      });
    }

    return items;
  }, [allServices]);

  const filteredServices = useMemo(() => {
    let f = [...allServices];
    if (activeTab === 'active') f = f.filter(s => s.isActive);
    else if (activeTab === 'inactive') f = f.filter(s => !s.isActive);
    else if (activeTab === 'promotional') f = f.filter(s => s.isPromotional);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(s => s.name.toLowerCase().includes(q) || s.category?.name?.toLowerCase().includes(q));
    }
    return f;
  }, [allServices, activeTab, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredServices.length) setSelected(new Set());
    else setSelected(new Set(filteredServices.map(s => s.id)));
  };

  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    await bulkDelete.mutateAsync(Array.from(selected));
    setSelected(new Set());
  };

  const handleBatchToggle = async (active: boolean) => {
    if (selected.size === 0) return;
    await bulkToggle.mutateAsync({ ids: Array.from(selected), isActive: active });
    setSelected(new Set());
  };

  const handleExport = () => {
    const csv = [
      ['Nom', 'Catégorie', 'Prix', 'Durée', 'Réservations', 'Note', 'Statut'],
      ...allServices.map(s => [
        s.name,
        s.category?.name || '',
        s.price?.toString() || '',
        s.duration?.toString() || '',
        s.bookingCount?.toString() || '0',
        s.rating?.toString() || '',
        s.isActive ? 'Actif' : 'Inactif',
      ]),
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'services.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (error) return <ErrorState message="Erreur lors du chargement" onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Services</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez vos prestations</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExport} className="px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <Download className="h-4 w-4" />Export
          </button>
          <Link href="/dashboard/services/categories">
            <Button variant="outline" size="sm"><Tag className="h-4 w-4 mr-1.5" />Catégories</Button>
          </Link>
          <Link href="/dashboard/services/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouveau service</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard icon={<Scissors className="h-5 w-5" />} iconBg="bg-brand/10" iconColor="text-brand" label="Total" value={stats.totalServices} />
        <StatsCard icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Actifs" value={stats.activeServices} />
        <StatsCard icon={<Star className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" label="Note" value={stats.avgRating} />
        <StatsCard icon={<Users className="h-5 w-5" />} iconBg="bg-blue-50" iconColor="text-blue-600" label="Réservations" value={stats.totalBookings} />
      </div>

      {/* Suggestions intelligentes */}
      {suggestions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {suggestions.map((s) => {
            const Icon = s.icon;
            const colorMap: Record<string, string> = {
              no_bookings: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10',
              popular: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10',
              inactive: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10',
              promo: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10',
            };
            const iconColorMap: Record<string, string> = {
              no_bookings: 'text-blue-600',
              popular: 'text-emerald-600',
              inactive: 'text-amber-600',
              promo: 'text-purple-600',
            };
            return (
              <div key={s.type} className={`rounded-2xl border p-4 ${colorMap[s.type]}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 ${iconColorMap[s.type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.description}</p>
                    {s.services.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {s.services.map(svc => (
                          <Link key={svc.id} href={`/dashboard/services/${svc.id}`}
                            className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                            <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{svc.name}</span>
                            {s.type === 'no_bookings' && <span className="text-blue-600 shrink-0 ml-2">0 réservation</span>}
                            {s.type === 'popular' && <span className="text-emerald-600 shrink-0 ml-2">{svc.bookingCount} réserv.</span>}
                            {s.type === 'inactive' && <span className="text-amber-600 shrink-0 ml-2">Désactivé</span>}
                            {s.type === 'promo' && <span className="text-purple-600 shrink-0 ml-2">{(svc.price ?? 0).toLocaleString()} FCFA</span>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  activeTab === tab.id ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700')}>
                {tab.label}
                <span className={cn('text-xs px-1.5 py-0.5 rounded-full',
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400')}>
                  {tab.id === 'all' ? stats.totalServices
                    : tab.id === 'active' ? stats.activeServices
                    : tab.id === 'inactive' ? stats.totalServices - stats.activeServices
                    : allServices.filter(s => s.isPromotional).length}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button onClick={() => setViewMode('grid')} className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-400')}><Grid3X3 className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('list')} className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-400')}><List className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher un service..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {/* Batch Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-brand/5 rounded-2xl border border-brand/20">
          <CheckSquare className="h-5 w-5 text-brand" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{selected.size} sélectionné(s)</span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => handleBatchToggle(true)}>Activer</Button>
          <Button size="sm" variant="outline" onClick={() => handleBatchToggle(false)}>Désactiver</Button>
          <Button size="sm" variant="outline" onClick={handleBatchDelete} className="text-red-500 hover:text-red-600">Supprimer</Button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>
      ) : filteredServices.length === 0 ? (
        <Card className="text-center py-12">
          <Scissors className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucun service</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{searchQuery ? 'Essayez autre chose' : 'Ajoutez votre premier service'}</p>
          {!searchQuery && <Link href="/dashboard/services/new"><Button><Plus className="h-4 w-4 mr-1.5" />Nouveau service</Button></Link>}
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map(service => (
            <ServiceCard key={service.id} service={service} isSelected={selected.has(service.id)}
              onToggleSelect={() => toggleSelect(service.id)} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-4 w-10">
                  <input type="checkbox" checked={selected.size === filteredServices.length && filteredServices.length > 0}
                    onChange={toggleSelectAll} className="rounded border-gray-300 text-brand focus:ring-brand" />
                </th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Service</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Catégorie</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase">Prix</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Durée</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Réserv.</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Note</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="p-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredServices.map(service => (
                <ServiceRow key={service.id} service={service} isSelected={selected.has(service.id)}
                  onToggleSelect={() => toggleSelect(service.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getBadges(service: ServiceItem) {
  const badges: { label: string; className: string }[] = [];
  if (service.isPromotional) badges.push({ label: 'PROMO', className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' });
  if ((service.bookingCount || 0) >= 20) badges.push({ label: '🔥 Populaire', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' });
  if ((service.rating || 0) >= 4.5 && (service.reviewCount || 0) >= 5) badges.push({ label: '⭐ Recommandé', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' });
  if (service.createdAt && (Date.now() - new Date(service.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 30) {
    badges.push({ label: '🆕 Nouveau', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' });
  }
  return badges;
}

function ServiceCard({ service, isSelected, onToggleSelect }: { service: ServiceItem; isSelected: boolean; onToggleSelect: () => void }) {
  const badges = getBadges(service);
  return (
    <div className={cn('group bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden hover:border-brand/30 hover:shadow-sm transition-all duration-200',
      isSelected ? 'border-brand ring-2 ring-brand/20' : 'border-gray-200 dark:border-gray-700')}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={isSelected} onChange={onToggleSelect}
              className="rounded border-gray-300 text-brand focus:ring-brand" />
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <Scissors className="h-5 w-5 text-brand" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {badges.slice(0, 2).map((b, i) => (
              <span key={i} className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${b.className}`}>{b.label}</span>
            ))}
            {!service.isActive && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-500 rounded-full">INACTIF</span>}
          </div>
        </div>
        <Link href={`/dashboard/services/${service.id}`}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-brand transition-colors">{service.name}</h3>
        </Link>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{service.shortDescription || service.category?.name}</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {service.priceType === 'VARIABLE' ? 'Variable' : `${(service.price ?? 0).toLocaleString()} FCFA`}
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />{service.duration}min
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceRow({ service, isSelected, onToggleSelect }: { service: ServiceItem; isSelected: boolean; onToggleSelect: () => void }) {
  const badges = getBadges(service);
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
      <td className="p-4">
        <input type="checkbox" checked={isSelected} onChange={onToggleSelect}
          className="rounded border-gray-300 text-brand focus:ring-brand" />
      </td>
      <td className="p-4">
        <Link href={`/dashboard/services/${service.id}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0"><Scissors className="h-5 w-5 text-brand" /></div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{service.name}</p>
            <p className="text-xs text-gray-500">{service.shortDescription}</p>
            {badges.length > 0 && (
              <div className="flex gap-1 mt-0.5">
                {badges.map((b, i) => (
                  <span key={i} className={`text-[10px] font-bold px-1 py-0.5 rounded ${b.className}`}>{b.label}</span>
                ))}
              </div>
            )}
          </div>
        </Link>
      </td>
      <td className="p-4 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">{service.category?.name || '-'}</td>
      <td className="p-4 text-right text-sm font-semibold">
        {service.isPromotional && service.promotionalPrice
          ? <><span className="line-through text-gray-400 text-xs">{(service.price ?? 0).toLocaleString()}</span> <span className="text-red-500">{(service.promotionalPrice ?? 0).toLocaleString()} FCFA</span></>
          : `${(service.price ?? 0).toLocaleString()} FCFA`}
      </td>
      <td className="p-4 text-right text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">{service.duration}min</td>
      <td className="p-4 text-right text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">{service.bookingCount}</td>
      <td className="p-4 text-right text-sm font-medium text-amber-500 hidden md:table-cell">{service.rating || '-'}</td>
      <td className="p-4 text-right">
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', service.isActive ? 'text-emerald-600' : 'text-gray-400')}>
          <span className={cn('w-2 h-2 rounded-full', service.isActive ? 'bg-emerald-500' : 'bg-gray-300')} />
          {service.isActive ? 'Actif' : 'Inactif'}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/dashboard/services/${service.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand">
            <Eye className="h-4 w-4" />
          </Link>
          <Link href={`/dashboard/services/${service.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500">
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}
