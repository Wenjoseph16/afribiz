'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Percent, Plus, Search, Grid3X3, List, Eye, Pencil, Trash2,
  Gift, Tag, TrendingUp, Loader,
  CalendarDays, AlertTriangle, Zap,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useMyPromotions, useDeletePromotion, usePromoStats } from '@/features/hooks';

interface PromotionItem {
  id: string; title: string; description: string | null;
  discountType: string; discountValue: number; code: string | null;
  startsAt: string | null; endsAt: string | null;
  isActive: boolean; image: string | null;
  createdAt?: string;
}

type TabType = 'all' | 'active' | 'inactive' | 'expired';

export default function PromotionsPage() {
  const { data: promosData, isLoading, error, refetch } = useMyPromotions();
  const { data: statsData } = usePromoStats();
  const deletePromotion = useDeletePromotion();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const allPromos: PromotionItem[] = Array.isArray(promosData) ? promosData : (promosData?.promotions || promosData?.data || []);

  const stats = statsData || {
    total: allPromos.length,
    active: allPromos.filter(p => p.isActive).length,
    campaigns: allPromos.filter(p => p.discountType === 'BUY_X_GET_Y').length,
  };

  const now = new Date();
  const filtered = useMemo(() => {
    let f = [...allPromos];
    switch (activeTab) {
      case 'active': f = f.filter(p => p.isActive && (!p.endsAt || new Date(p.endsAt) > now)); break;
      case 'inactive': f = f.filter(p => !p.isActive); break;
      case 'expired': f = f.filter(p => p.endsAt && new Date(p.endsAt) <= now); break;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(p => p.title.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q) || p.discountType.toLowerCase().includes(q));
    }
    return f;
  }, [allPromos, activeTab, searchQuery]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette promotion ?')) return;
    try { await deletePromotion.mutateAsync(id); } catch (err) { console.error(err); }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Promotions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez vos offres promotionnelles et codes de réduction</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard/promotions/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouvelle promotion</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard icon={<Percent className="h-5 w-5" />} iconBg="bg-brand-50" iconColor="text-brand" label="Total" value={stats.total} />
        <StatsCard icon={<Gift className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Actives" value={stats.active} />
        <StatsCard icon={<Tag className="h-5 w-5" />} iconBg="bg-purple-50" iconColor="text-purple-600" label="Campagnes" value={stats.campaigns} />
        <StatsCard icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" label="Taux d'utilisation" value={allPromos.length > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : '0%'} />
      </div>

      {/* Suggestions intelligentes */}
      {allPromos.length > 0 && (() => {
        const active = allPromos.filter(p => p.isActive && (!p.endsAt || new Date(p.endsAt) > now));
        const expired = allPromos.filter(p => p.endsAt && new Date(p.endsAt) <= now);
        const noCode = allPromos.filter(p => !p.code);
        const types = [...new Set(allPromos.map(p => p.discountType))];

        const suggestions = [
          active.length > 0 && {
            type: 'active', icon: Gift,
            title: `${active.length} promotion${active.length > 1 ? 's' : ''} active${active.length > 1 ? 's' : ''}`,
            desc: 'Suivez leurs performances et leur impact sur les ventes',
            color: 'emerald',
          },
          expired.length > 0 && {
            type: 'expired', icon: AlertTriangle,
            title: `${expired.length} promotion${expired.length > 1 ? 's' : ''} expirée${expired.length > 1 ? 's' : ''}`,
            desc: 'Reconduisez les offres qui ont fonctionné',
            color: 'amber',
          },
          noCode.length > 0 && {
            type: 'no_code', icon: Zap,
            title: `${noCode.length} promotion${noCode.length > 1 ? 's' : ''} sans code`,
            desc: 'Ajoutez un code pour faciliter le suivi des utilisations',
            color: 'blue',
          },
          types.length > 0 && {
            type: 'types', icon: CalendarDays,
            title: `${types.length} type${types.length > 1 ? 's' : ''} de réduction`,
            desc: types.map(t => typeLabels[t] || t).join(', '),
            color: 'purple',
          },
        ].filter(Boolean);

        if (suggestions.length === 0) return null;

        const colorMap: Record<string, string> = {
          emerald: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10',
          amber: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
          blue: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
          purple: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
        };

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s: any, i) => (
              <Link key={i} href={s.link || '/dashboard/promotions'}
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
          {(['all', 'active', 'inactive', 'expired'] as TabType[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>
              {tab === 'all' ? 'Toutes' : tab === 'active' ? 'Actives' : tab === 'inactive' ? 'Inactives' : 'Expirées'}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher une promotion..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
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
          <Percent className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucune promotion trouvée</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'Essayez une autre recherche' : 'Créez votre première promotion'}
          </p>
          <Link href="/dashboard/promotions/new"><Button><Plus className="h-4 w-4 mr-1.5" />Nouvelle promotion</Button></Link>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((promo) => (
            <PromoCard key={promo.id} promo={promo} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Promotion</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Période</th>
                <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="p-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((promo) => (
                <PromoRow key={promo.id} promo={promo} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const typeLabels: Record<string, string> = {
  PERCENTAGE: 'Pourcentage',
  FIXED: 'Montant fixe',
  FREE_SHIPPING: 'Livraison offerte',
  BUY_X_GET_Y: 'Acheté 1 offert',
};

function getBadge(promo: PromotionItem): { label: string; class: string } | null {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (promo.createdAt && new Date(promo.createdAt) > thirtyDaysAgo) {
    return { label: '🆕 Nouvelle', class: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300' };
  }
  return null;
}

function PromoCard({ promo, onDelete }: { promo: PromotionItem; onDelete: (id: string) => Promise<void> }) {
  const now = new Date();
  const endsAt = promo.endsAt ? new Date(promo.endsAt) : null;
  const isExpired = endsAt && endsAt <= now;
  const active = promo.isActive && !isExpired;
  const badge = getBadge(promo);

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand/30 hover:shadow-sm transition-all duration-200">
      <div className="aspect-video bg-gradient-to-br from-brand-50 to-amber-50 dark:from-brand-900/20 dark:to-amber-900/20 flex items-center justify-center relative">
        {badge && (
          <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/90 dark:bg-gray-900/90 shadow-sm">{badge.label}</span>
        )}
        {promo.discountType === 'PERCENTAGE' ? (
          <Percent className="h-12 w-12 text-brand/30 dark:text-brand-400/30" />
        ) : promo.discountType === 'FREE_SHIPPING' ? (
          <Gift className="h-12 w-12 text-brand/30 dark:text-brand-400/30" />
        ) : (
          <Tag className="h-12 w-12 text-brand/30 dark:text-brand-400/30" />
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{promo.title}</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Tag className="h-3.5 w-3.5" />
          {typeLabels[promo.discountType] || promo.discountType} · {promo.discountValue}{promo.discountType === 'PERCENTAGE' ? '%' : ' FCFA'}
        </div>
        {promo.code && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-brand font-semibold">{promo.code}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', {
            'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20': active,
            'text-red-600 bg-red-50 dark:bg-red-900/20': !promo.isActive,
            'text-gray-500 bg-gray-100 dark:bg-gray-800': isExpired,
          })}>
            {isExpired ? 'Expirée' : active ? 'Active' : 'Inactive'}
          </span>
          <div className="flex items-center gap-1">
            <Link href={`/dashboard/promotions/${promo.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors">
              <Eye className="h-3.5 w-3.5" />
            </Link>
            <Link href={`/dashboard/promotions/${promo.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            <button onClick={() => onDelete(promo.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PromoRow({ promo, onDelete }: { promo: PromotionItem; onDelete: (id: string) => Promise<void> }) {
  const now = new Date();
  const endsAt = promo.endsAt ? new Date(promo.endsAt) : null;
  const isExpired = endsAt && endsAt <= now;
  const active = promo.isActive && !isExpired;
  const startDate = promo.startsAt ? new Date(promo.startsAt) : null;
  const badge = getBadge(promo);

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
            <Percent className="h-5 w-5 text-brand" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{promo.title}</p>
            <p className="text-xs text-gray-500">{promo.description || 'Aucune description'}</p>
            {badge && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 inline-block bg-gray-100 dark:bg-gray-700">{badge.label}</span>}
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">{typeLabels[promo.discountType] || promo.discountType}</span>
      </td>
      <td className="p-4">
        {promo.code ? (
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-brand font-semibold">{promo.code}</span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {startDate ? startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'N/A'}
          {endsAt ? ` - ${endsAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
        </span>
      </td>
      <td className="p-4 text-center">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', {
          'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20': active,
          'text-red-600 bg-red-50 dark:bg-red-900/20': !promo.isActive,
          'text-gray-500 bg-gray-100 dark:bg-gray-800': isExpired,
        })}>
          {isExpired ? 'Expirée' : active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/dashboard/promotions/${promo.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors">
            <Eye className="h-4 w-4" />
          </Link>
          <Link href={`/dashboard/promotions/${promo.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors">
            <Pencil className="h-4 w-4" />
          </Link>
          <button onClick={() => onDelete(promo.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
