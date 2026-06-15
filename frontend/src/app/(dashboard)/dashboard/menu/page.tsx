'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed, Plus, Search, Eye, Pencil, Clock, Star,
  ShoppingBag, TrendingUp, Tag, Loader, Utensils, Power,
  CheckCircle, XCircle, AlertTriangle, Lightbulb, Zap,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ErrorState } from '@/components/ui/ErrorState';
import { useMyMenuItems, useMenuStats, useToggleMenuItemActive } from '@/features/hooks';
import { useNotifyError } from '@/hooks/useNotifyError';

interface MenuItem {
  id: string; name: string; description: string; shortDescription?: string;
  price: number; type: string; category?: { id: string; name: string }; status: string;
  isPopular: boolean; isStar: boolean; isActive: boolean; featured: boolean;
  prepTime: number; cookTime: number; rating: number;
  orderCount: number; soldCount?: number;
  isPromotional?: boolean; createdAt?: string;
}

const isNewItem = (i: MenuItem) => {
  if (!i.createdAt) return false;
  const age = (Date.now() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return age < 30;
};

function getBadges(item: MenuItem): { label: string; className: string }[] {
  const b: { label: string; className: string }[] = [];
  if (item.isPromotional) b.push({ label: 'PROMO', className: 'bg-red-100 text-red-700' });
  if (item.isPopular) b.push({ label: '🔥 Populaire', className: 'bg-emerald-100 text-emerald-700' });
  if (item.isStar) b.push({ label: '⭐ Plat star', className: 'bg-amber-100 text-amber-700' });
  if (isNewItem(item)) b.push({ label: '🆕 Nouveau', className: 'bg-purple-100 text-purple-700' });
  if (item.featured) b.push({ label: 'À la une', className: 'bg-blue-100 text-blue-700' });
  return b;
}

export default function MenuPage() {
  const { data: itemsData, isLoading, error, refetch } = useMyMenuItems();
  const { data: statsData } = useMenuStats();
  const toggleActive = useToggleMenuItemActive();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const items: MenuItem[] = Array.isArray(itemsData) ? itemsData : (itemsData?.items || itemsData?.data || []);

  const stats = statsData || {
    total: items.length,
    available: items.filter(i => i.status === 'AVAILABLE').length,
    sold: items.reduce((a, i) => a + (i.soldCount || 0), 0),
    avgRating: items.length > 0 ? items.reduce((a, i) => a + (i.rating || 0), 0) / items.length : 0,
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleActive.mutateAsync(id);
    } catch (err) { notifyError(err, 'Erreur', 'Impossible de modifier le statut'); }
  };

  const notifyError = useNotifyError();

  const handleBulkToggle = async (isActive: boolean) => {
    for (const id of selectedIds) {
      await toggleActive.mutateAsync(id);
    }
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(i => i.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const types = ['Tous', ...[...new Set(items.map(i => i.type).filter(Boolean))]];

  const suggestions = useMemo(() => {
    const result: {
      type: string; title: string; description: string; count: string;
      link: string; icon: React.ReactNode; bg: string; border: string; iconBg: string; countColor: string;
    }[] = [];
    const noSales = items.filter(i => (i.soldCount || 0) === 0);
    if (noSales.length > 0) {
      result.push({
        type: 'no_sales', title: 'Plats sans vente',
        description: 'Ces plats n\'ont jamais été commandés. Réduisez les prix ou faites une promo.',
        count: `${noSales.length}`, link: '#',
        icon: <Lightbulb className="h-5 w-5 text-blue-600" />,
        bg: '#eff6ff', border: '#bfdbfe', iconBg: '#dbeafe', countColor: '#2563eb',
      });
    }
    const popular = items.filter(i => i.isPopular);
    if (popular.length > 0) {
      result.push({
        type: 'popular', title: 'Plats populaires',
        description: 'Ces plats sont les plus demandés. Mettez-les en avant.',
        count: `${popular.length}`, link: '#',
        icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
        bg: '#ecfdf5', border: '#a7f3d0', iconBg: '#d1fae5', countColor: '#059669',
      });
    }
    const inactive = items.filter(i => i.isActive === false);
    if (inactive.length > 0) {
      result.push({
        type: 'inactive', title: 'Plats inactifs',
        description: 'Ces plats ne sont pas visibles dans le menu public.',
        count: `${inactive.length}`, link: '#',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        bg: '#fffbeb', border: '#fde68a', iconBg: '#fef3c7', countColor: '#d97706',
      });
    }
    const promos = items.filter(i => i.isPromotional);
    if (promos.length > 0) {
      result.push({
        type: 'promo', title: 'Promotions actives',
        description: 'Plats avec un prix promotionnel en cours.',
        count: `${promos.length}`, link: '#',
        icon: <Zap className="h-5 w-5 text-purple-600" />,
        bg: '#f5f3ff', border: '#ddd6fe', iconBg: '#ede9fe', countColor: '#7c3aed',
      });
    }
    return result;
  }, [items]);

  const filtered = useMemo(() => {
    let f = [...items];
    if (typeFilter !== 'Tous') f = f.filter(i => i.type === typeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(i => i.name.toLowerCase().includes(q) || i.category?.name?.toLowerCase().includes(q));
    }
    return f;
  }, [items, typeFilter, searchQuery]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Menu / Carte</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez vos plats et articles de menu</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/menu/categories"><Button variant="outline" size="sm"><Tag className="h-4 w-4 mr-1.5" />Catégories</Button></Link>
          <Link href="/dashboard/menu/new"><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouveau plat</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard icon={<UtensilsCrossed className="h-5 w-5" />} iconBg="bg-brand/10" iconColor="text-brand" label="Total plats" value={stats.total} />
        <StatsCard icon={<ShoppingBag className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Disponibles" value={stats.available} />
        <StatsCard icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-purple-50" iconColor="text-purple-600" label="Vendus" value={stats.sold} />
        <StatsCard icon={<Star className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" label="Note" value={typeof stats.avgRating === 'number' ? stats.avgRating.toFixed(1) : '0.0'} />
      </div>

      {/* Suggestions intelligentes */}
      {suggestions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {suggestions.map(s => (
            <Link key={s.type} href={s.link} className="block p-4 rounded-2xl border transition-all hover:shadow-sm" style={{ backgroundColor: s.bg, borderColor: s.border }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.iconBg }}>
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{s.description}</p>
                </div>
                <span className="text-xs font-bold" style={{ color: s.countColor }}>{s.count}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto">
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors', typeFilter === t ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300')}>{t}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-lg', viewMode === 'grid' ? 'bg-brand/10 text-brand' : 'text-gray-400 hover:bg-gray-100')} title="Grille">
              <div className="grid grid-cols-2 gap-0.5"><div className="w-1.5 h-1.5 rounded-sm bg-current" /><div className="w-1.5 h-1.5 rounded-sm bg-current" /><div className="w-1.5 h-1.5 rounded-sm bg-current" /><div className="w-1.5 h-1.5 rounded-sm bg-current" /></div>
            </button>
            <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-lg', viewMode === 'list' ? 'bg-brand/10 text-brand' : 'text-gray-400 hover:bg-gray-100')} title="Liste">
              <div className="flex flex-col gap-0.5"><div className="w-3 h-0.5 rounded bg-current" /><div className="w-3 h-0.5 rounded bg-current" /><div className="w-3 h-0.5 rounded bg-current" /></div>
            </button>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-brand/5 rounded-xl border border-brand/20">
          <span className="text-sm text-gray-600 dark:text-gray-400">{selectedIds.length} sélectionné(s)</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="secondary" onClick={() => handleBulkToggle(true)}><CheckCircle className="w-3.5 h-3.5 mr-1" />Activer</Button>
            <Button size="sm" variant="secondary" onClick={() => handleBulkToggle(false)}><XCircle className="w-3.5 h-3.5 mr-1" />Désactiver</Button>
            <Button size="sm" variant="secondary" onClick={() => setSelectedIds([])}>Annuler</Button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <UtensilsCrossed className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucun plat</h3>
          <Link href="/dashboard/menu/new"><Button><Plus className="h-4 w-4 mr-1.5" />Ajouter un plat</Button></Link>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => <MenuItemCard key={item.id} item={item} onToggle={handleToggleActive} />)}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Plat</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase">Prix</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase">Prép.</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase">Vendus</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase">Note</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="p-4 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(item => <MenuRow key={item.id} item={item} selected={selectedIds.includes(item.id)} onToggleSelect={toggleSelect} onToggleActive={handleToggleActive} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MenuItemCard({ item, onToggle }: { item: MenuItem; onToggle: (id: string) => void }) {
  const badges = getBadges(item);
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand/30 transition-all">
      <Link href={`/dashboard/menu/${item.id}`} className="block p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center"><Utensils className="h-5 w-5 text-brand" /></div>
          {badges.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {badges.map((b, i) => (
                <span key={i} className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${b.className}`}>{b.label}</span>
              ))}
            </div>
          )}
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-2">{item.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{item.shortDescription?.slice(0, 60) || item.description?.slice(0, 60)}</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm font-bold">{item.price.toLocaleString()} FCFA</p>
          <p className="text-xs text-gray-500"><Clock className="h-3 w-3 inline" /> {(item.prepTime || 0) + (item.cookTime || 0)}min</p>
        </div>
      </Link>
      <div className="px-4 pb-3 flex items-center gap-1">
        <button onClick={() => onToggle(item.id)} className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors', item.isActive !== false ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200')}>
          <Power className="w-3 h-3" />{item.isActive !== false ? 'Actif' : 'Inactif'}
        </button>
        <Link href={`/dashboard/menu/${item.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 ml-auto"><Pencil className="w-3.5 h-3.5" /></Link>
        <Link href={`/dashboard/menu/${item.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand"><Eye className="w-3.5 h-3.5" /></Link>
      </div>
    </div>
  );
}

function MenuRow({ item, selected, onToggleSelect, onToggleActive }: { item: MenuItem; selected: boolean; onToggleSelect: (id: string) => void; onToggleActive: (id: string) => void }) {
  const badges = getBadges(item);
  return (
    <tr className={cn('hover:bg-gray-50 dark:hover:bg-gray-700/30 group', selected && 'bg-brand/5')}>
      <td className="p-4 w-10">
        <input type="checkbox" checked={selected} onChange={() => onToggleSelect(item.id)} className="rounded border-gray-300 dark:border-gray-600 text-brand focus:ring-brand" />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0"><Utensils className="h-5 w-5 text-brand" /></div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
            <p className="text-xs text-gray-500">{item.category?.name}</p>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {badges.map((b, i) => (
                  <span key={i} className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${b.className}`}>{b.label}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{item.type}</td>
      <td className="p-4 text-right text-sm font-semibold">{item.price.toLocaleString()} FCFA</td>
      <td className="p-4 text-right text-sm text-gray-600 dark:text-gray-400">{(item.prepTime || 0) + (item.cookTime || 0)}min</td>
      <td className="p-4 text-right text-sm text-gray-600 dark:text-gray-400">{item.orderCount || item.soldCount || 0}</td>
      <td className="p-4 text-right text-sm font-medium text-amber-500">{item.rating || '-'}</td>
      <td className="p-4 text-right">
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', item.isActive !== false ? 'text-emerald-600' : 'text-gray-400')}>
          <span className={cn('w-2 h-2 rounded-full', item.isActive !== false ? 'bg-emerald-500' : 'bg-gray-300')} />{item.isActive !== false ? 'Actif' : 'Inactif'}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <button onClick={() => onToggleActive(item.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-emerald-500" title="Activer/Désactiver"><Power className="h-4 w-4" /></button>
          <Link href={`/dashboard/menu/${item.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand"><Eye className="h-4 w-4" /></Link>
          <Link href={`/dashboard/menu/${item.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500"><Pencil className="h-4 w-4" /></Link>
        </div>
      </td>
    </tr>
  );
}
