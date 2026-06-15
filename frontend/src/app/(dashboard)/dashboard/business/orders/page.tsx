'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, Clock, Package, Truck, CheckCircle2, XCircle,
  Search, ChevronRight, Store, User, Phone, AlertTriangle, RefreshCw,
  TrendingUp, Loader,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useMyBusinessOrders, useBusinessOrderStats, useUpdateBusinessOrderStatus } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';
import OrderActionModal from '@/components/orders/OrderActionModal';

const STATUS_CONFIG: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'info' | 'default'; color: string }> = {
  PENDING: { label: 'En attente', variant: 'warning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CONFIRMED: { label: 'Confirmée', variant: 'info', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  ACCEPTED: { label: 'Acceptée', variant: 'success', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  PREPARING: { label: 'En préparation', variant: 'info', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  READY: { label: 'Prête', variant: 'success', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  DELIVERING: { label: 'En livraison', variant: 'info', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  DELIVERED: { label: 'Livrée', variant: 'success', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  COMPLETED: { label: 'Terminée', variant: 'default', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  REFUSED: { label: 'Refusée', variant: 'danger', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  CANCELLED: { label: 'Annulée', variant: 'danger', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  DISPUTE: { label: 'Litige', variant: 'danger', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

const TABS = [
  { key: 'all', label: 'Toutes', icon: ShoppingBag },
  { key: 'PENDING', label: 'En attente', icon: Clock },
  { key: 'ACCEPTED', label: 'Acceptées', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'En cours', icon: Package },
  { key: 'DELIVERED', label: 'Livrées', icon: Truck },
  { key: 'REFUSED', label: 'Refusées', icon: XCircle },
  { key: 'CANCELLED', label: 'Annulées', icon: XCircle },
];

export default function BusinessOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount'>('newest');
  const [actionOrder, setActionOrder] = useState<any>(null);

  const params = useMemo(() => {
    const p: any = { limit: 100 };
    if (activeTab !== 'all' && activeTab !== 'today') p.status = activeTab;
    if (search) p.search = search;
    if (dateFilter === 'today') {
      const d = new Date();
      p.dateFrom = d.toISOString().split('T')[0];
      p.dateTo = d.toISOString().split('T')[0];
    }
    if (dateFilter === 'week') {
      const d = new Date();
      p.dateFrom = new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    if (dateFilter === 'month') {
      const d = new Date();
      p.dateFrom = new Date(d.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    return p;
  }, [activeTab, search, dateFilter]);

  const { data: ordersData, isLoading, error, refetch } = useMyBusinessOrders(params);
  const { data: statsData } = useBusinessOrderStats();

  const orders = ordersData?.orders || [];
  const pagination = ordersData;

  const stats = useMemo(() => {
    const s = statsData || {};
    return {
      total: s.total || orders.length,
      pending: s.pending || 0,
      accepted: s.accepted || 0,
      preparing: s.preparing || 0,
      delivered: s.delivered || 0,
      completed: s.completed || 0,
      refused: s.refused || 0,
      cancelled: s.cancelled || 0,
      totalRevenue: s.totalRevenue || 0,
      todayRevenue: s.todayRevenue || 0,
    };
  }, [statsData, orders.length]);

  const sortedOrders = useMemo(() => {
    const list = [...orders];
    switch (sortBy) {
      case 'oldest': return list.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'amount': return list.sort((a: any, b: any) => Number(b.totalAmount || 0) - Number(a.totalAmount || 0));
      default: return list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [orders, sortBy]);

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Commandes reçues</h1>
        </div>
        <Card className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-300 mx-auto mb-3" />
          <p className="text-gray-500">Erreur de chargement des commandes</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>Réessayer</Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Commandes reçues</h1>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader className="h-8 w-8 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Commandes reçues
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez les commandes de vos clients en temps réel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm">
              <ShoppingBag className="h-4 w-4 mr-1.5" />
              Mes achats
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
              <ShoppingBag className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Total</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500">En attente</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Acceptées</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.accepted}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100">
              <Package className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500">En cours</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.preparing}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100">
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Livrées</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.delivered}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Revenu</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(stats.totalRevenue)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending orders alert */}
      {stats.pending > 0 && (
        <Card className={cn('p-4 border-2', stats.pending >= 5 ? 'border-red-200 dark:border-red-800' : 'border-amber-200 dark:border-amber-800')}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-xl',
              stats.pending >= 5 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
            )}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {stats.pending} commande{stats.pending > 1 ? 's' : ''} en attente de traitement
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {stats.pending >= 5
                  ? 'Des clients attendent depuis plus de 15 min. Traitez les rapidement pour les rassurer.'
                  : 'Les clients seront notifiés dès que vous aurez traité leur commande.'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('PENDING')}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-brand text-white hover:bg-brand-700 transition-colors shrink-0"
            >
              Voir les {stats.pending} commande{stats.pending > 1 ? 's' : ''}
            </button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  activeTab === tab.key
                    ? 'bg-brand text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {tab.key !== 'all' && <Icon className="h-3.5 w-3.5" />}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search + Filters row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par n° commande, client, téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="all">Toute période</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="newest">Plus récentes</option>
              <option value="oldest">Plus anciennes</option>
              <option value="amount">Montant ↓</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {sortedOrders.length === 0 ? (
        <Card className="text-center py-16">
          <ShoppingBag className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {search || activeTab !== 'all'
              ? 'Aucune commande trouvée'
              : 'Vous n\'avez pas encore reçu de commande'}
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            {search
              ? 'Essayez une autre recherche ou modifiez vos filtres.'
              : 'Partagez votre page publique avec vos clients pour commencer à recevoir des commandes.'}
          </p>
          <Link href="/dashboard/public-page">
            <Button variant="primary">
              <Store className="h-4 w-4 mr-1.5" />
              Voir ma page publique
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedOrders.map((order: any) => {
            const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const itemCount = order.items?.length || 0;
            const buyerName = order.contactName
              || (order.buyer ? `${order.buyer.firstName || ''} ${order.buyer.lastName || ''}`.trim() : null)
              || 'Client';
            const buyerPhone = order.contactPhone || order.buyer?.phone;
            const isPending = order.status === 'PENDING';
            const elapsed = order.createdAt
              ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
              : 0;

            return (
              <div key={order.id} className="group">
                <div className="flex items-start gap-2">
                  <Link
                    href={`/dashboard/business/orders/${order.id}`}
                    className="flex-1 min-w-0"
                  >
                    <Card className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', s.color)}>
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {order.orderNumber || `#${order.id.slice(0, 8)}`}
                                </h3>
                                <Badge variant={s.variant} size="xs">{s.label}</Badge>
                                {isPending && elapsed > 15 && (
                                  <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full">
                                    <AlertTriangle className="h-3 w-3" />
                                    {elapsed >= 60 ? '> 1h' : `${elapsed} min`}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {buyerName}
                                </span>
                                {buyerPhone && (
                                  <a
                                    href={`tel:${buyerPhone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 hover:text-brand"
                                  >
                                    <Phone className="w-3 h-3" />
                                    {buyerPhone}
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {formatPrice(Number(order.totalAmount || 0))}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {itemCount} article{itemCount > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                  })
                                : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <Store className="w-3.5 h-3.5" />
                              {order.source || 'Site'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors shrink-0 mt-2" />
                      </div>
                    </Card>
                  </Link>

                  {/* Quick action button for pending orders */}
                  {isPending && (
                    <button
                      onClick={() => setActionOrder(order)}
                      className="shrink-0 mt-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 transition-all hover:scale-105 active:scale-95"
                      title="Traiter la commande"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pagination info */}
          {pagination?.totalPages > 1 && (
            <div className="text-center text-xs text-gray-500 py-4">
              Page {pagination?.page || 1} sur {pagination?.totalPages || 1} · {pagination?.total || orders.length} commande{orders.length > 1 ? 's' : ''} au total
            </div>
          )}
        </div>
      )}

      {/* Order Action Modal */}
      <OrderActionModal
        open={!!actionOrder}
        onClose={() => setActionOrder(null)}
        onSuccess={() => {
          refetch();
        }}
        order={{
          id: actionOrder?.id || '',
          orderNumber: actionOrder?.orderNumber,
          totalAmount: actionOrder?.totalAmount,
          contactName: actionOrder?.contactName
            || (actionOrder?.buyer ? `${actionOrder.buyer.firstName || ''} ${actionOrder.buyer.lastName || ''}`.trim() : null)
            || undefined,
          contactPhone: actionOrder?.contactPhone || actionOrder?.buyer?.phone,
          createdAt: actionOrder?.createdAt,
          items: actionOrder?.items,
        }}
      />
    </div>
  );
}
