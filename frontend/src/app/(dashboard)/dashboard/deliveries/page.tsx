'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Truck, Package, MapPin, User, Plus, Search, Grid3X3, List,
  Eye, Pencil, Clock, CheckCircle2, Loader,
  AlertTriangle,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeliveries, useDeliveryStats } from '@/features/hooks';

interface DeliveryItem {
  id: string; recipientName: string; recipientAddress: string;
  recipientPhone: string; zone: { name: string }; driver: { name: string };
  status: string; items: string; notes: string; createdAt: string;
}

type TabType = 'all' | 'pending' | 'in_transit' | 'delivered' | 'cancelled';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', in_transit: 'En transit', delivered: 'Livré', cancelled: 'Annulé',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  in_transit: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  delivered: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  cancelled: 'text-red-600 bg-red-50 dark:bg-red-900/20',
};

export default function DeliveriesPage() {
  const { data: deliveriesData, isLoading, error, refetch } = useDeliveries();
  const { data: statsData } = useDeliveryStats();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const allDeliveries: DeliveryItem[] = Array.isArray(deliveriesData)
    ? deliveriesData : (deliveriesData?.deliveries || deliveriesData?.data || []);

  const stats = statsData || {
    total: allDeliveries.length,
    inTransit: allDeliveries.filter(d => d.status === 'in_transit').length,
    delivered: allDeliveries.filter(d => d.status === 'delivered').length,
    pending: allDeliveries.filter(d => d.status === 'pending').length,
  };

  const filtered = useMemo(() => {
    let f = [...allDeliveries];
    if (activeTab !== 'all') f = f.filter(d => d.status === activeTab);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(d =>
        d.recipientName?.toLowerCase().includes(q) ||
        d.recipientAddress?.toLowerCase().includes(q) ||
        d.items?.toLowerCase().includes(q)
      );
    }
    return f;
  }, [allDeliveries, activeTab, searchQuery]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Livraisons</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez vos livraisons et suivez les expéditions</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard/deliveries/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouvelle livraison</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard icon={<Package className="h-5 w-5" />} iconBg="bg-brand-50" iconColor="text-brand" label="Total" value={stats.total} />
        <StatsCard icon={<Clock className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" label="En attente" value={stats.pending} />
        <StatsCard icon={<Truck className="h-5 w-5" />} iconBg="bg-blue-50" iconColor="text-blue-600" label="En transit" value={stats.inTransit} />
        <StatsCard icon={<CheckCircle2 className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Livrées" value={stats.delivered} />
      </div>

      {/* Suggestions intelligentes */}
      {allDeliveries.length > 0 && (() => {
        const pending = allDeliveries.filter(d => d.status === 'pending');
        const inTransit = allDeliveries.filter(d => d.status === 'in_transit');
        const cancelled = allDeliveries.filter(d => d.status === 'cancelled');
        const deliveredWeek = allDeliveries.filter(d => d.status === 'delivered');

        const suggestions = [
          pending.length > 0 && {
            type: 'pending', icon: Clock,
            title: `${pending.length} livraison${pending.length > 1 ? 's' : ''} en attente`,
            desc: 'Affectez un chauffeur pour démarrer la livraison',
            color: 'amber',
          },
          inTransit.length > 0 && {
            type: 'in_transit', icon: Truck,
            title: `${inTransit.length} livraison${inTransit.length > 1 ? 's' : ''} en transit`,
            desc: 'Suivez les livraisons en cours en temps réel',
            color: 'blue',
          },
          deliveredWeek.length > 0 && {
            type: 'delivered', icon: CheckCircle2,
            title: `${deliveredWeek.length} livraison${deliveredWeek.length > 1 ? 's' : ''} livrée${deliveredWeek.length > 1 ? 's' : ''}`,
            desc: 'Consultez les accusés de réception et preuves',
            color: 'emerald',
          },
          cancelled.length > 0 && {
            type: 'cancelled', icon: AlertTriangle,
            title: `${cancelled.length} annulation${cancelled.length > 1 ? 's' : ''}`,
            desc: 'Analysez les motifs pour améliorer le service',
            color: 'red',
          },
        ].filter(Boolean);

        if (suggestions.length === 0) return null;

        const colorMap: Record<string, string> = {
          amber: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
          blue: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
          emerald: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10',
          red: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
        };

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s: any, i) => (
              <Link key={i} href={`/dashboard/deliveries?tab=${s.type}`}
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
          {(['all', 'pending', 'in_transit', 'delivered', 'cancelled'] as TabType[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>
              {tab === 'all' ? 'Tous' : tab === 'pending' ? 'En attente' : tab === 'in_transit' ? 'En transit' : tab === 'delivered' ? 'Livrés' : 'Annulés'}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher une livraison..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
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
          <Truck className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucune livraison trouvée</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'Essayez une autre recherche' : 'Créez votre première livraison'}
          </p>
          <Link href="/dashboard/deliveries/new"><Button><Plus className="h-4 w-4 mr-1.5" />Nouvelle livraison</Button></Link>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((delivery) => (
            <DeliveryCard key={delivery.id} delivery={delivery} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Destinataire</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Adresse</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Chauffeur</th>
                <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="p-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((delivery) => (
                <DeliveryRow key={delivery.id} delivery={delivery} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getBadge(delivery: DeliveryItem): { label: string; class: string } | null {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const isNew = delivery.createdAt && new Date(delivery.createdAt) > thirtyDaysAgo;
  if (isNew) return { label: '🆕 Nouveau', class: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300' };
  return null;
}

function DeliveryCard({ delivery }: { delivery: DeliveryItem }) {
  const badge = getBadge(delivery);
  return (
    <Link href={`/dashboard/deliveries/${delivery.id}`}
      className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand/30 hover:shadow-sm transition-all duration-200">
      <div className="aspect-video bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-900/20 dark:to-emerald-900/20 flex items-center justify-center relative">
        <Truck className="h-12 w-12 text-brand/30 dark:text-brand-400/30" />
        {badge && (
          <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/90 dark:bg-gray-900/90 shadow-sm">{badge.label}</span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{delivery.recipientName}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{delivery.recipientAddress}</span>
        </div>
        {delivery.driver && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{delivery.driver.name}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Package className="h-3.5 w-3.5" />
            {delivery.items || '-'}
          </div>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_COLORS[delivery.status] || 'text-gray-600 bg-gray-50')}>
            {STATUS_LABELS[delivery.status] || delivery.status}
          </span>
        </div>
      </div>
    </Link>
  );
}

function DeliveryRow({ delivery }: { delivery: DeliveryItem }) {
  const badge = getBadge(delivery);
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-brand" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{delivery.recipientName}</p>
            <p className="text-xs text-gray-500">{delivery.recipientPhone}</p>
            {badge && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 inline-block bg-gray-100 dark:bg-gray-700">{badge.label}</span>}
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">{delivery.recipientAddress}</span>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">{delivery.zone?.name || '-'}</span>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">{delivery.driver?.name || '-'}</span>
      </td>
      <td className="p-4 text-center">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_COLORS[delivery.status] || 'text-gray-600 bg-gray-50')}>
          {STATUS_LABELS[delivery.status] || delivery.status}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/dashboard/deliveries/${delivery.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors">
            <Eye className="h-4 w-4" />
          </Link>
          <Link href={`/dashboard/deliveries/${delivery.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors">
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}
