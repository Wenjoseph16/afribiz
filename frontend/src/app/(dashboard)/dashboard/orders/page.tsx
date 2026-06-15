'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Plus, ChevronRight, Clock, Package, Truck, CheckCircle2, XCircle, DollarSign, Loader, Store, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useOrders } from '@/features/hooks';
import { useAuthStore } from '@/stores/authStore';
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

const TYPE_LABELS: Record<string, string> = {
  DELIVERY: 'Livraison', ON_SITE: 'Sur place', CLICK_COLLECT: 'Click & Collect',
  PREORDER: 'Précommande', QUICK: 'Commande rapide', CUSTOM: 'Personnalisée',
};

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'today', label: "Aujourd'hui" },
  { key: 'PENDING', label: 'En attente' },
  { key: 'ACCEPTED', label: 'Acceptées' },
  { key: 'PREPARING', label: 'En cours' },
  { key: 'DELIVERED', label: 'Livrées' },
  { key: 'COMPLETED', label: 'Terminées' },
  { key: 'CANCELLED', label: 'Annulées' },
];

export default function OrdersPage() {
  const { user } = useAuthStore();
  const isBusiness = user?.roles?.includes('BUSINESS') || user?.primaryRole === 'BUSINESS';

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [actionOrder, setActionOrder] = useState<any>(null);
  const { data: ordersData, isLoading, error, refetch } = useOrders({ limit: 100 });

  const allOrders = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || ordersData?.data || []);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const stats = {
    total: allOrders.length,
    today: allOrders.filter((o: any) => (o.createdAt || '').startsWith(todayStr)).length,
    pending: allOrders.filter((o: any) => o.status === 'PENDING').length,
    totalSpent: allOrders.reduce((a: number, o: any) => a + Number(o.totalAmount || 0), 0),
  };

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const suggestions = useMemo(() => {
    const items: {
      type: string; title: string; description: string; count: string;
      link: string; icon: React.ReactNode; bg: string; border: string; iconBg: string; countColor: string;
    }[] = [];

    const pending = allOrders.filter((o: any) => o.status === 'PENDING');
    if (pending.length > 0) {
      items.push({
        type: 'pending', title: 'En attente',
        description: 'Commandes en attente de traitement par le vendeur.',
        count: `${pending.length}`, link: '#',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        bg: '#fffbeb', border: '#fde68a', iconBg: '#fef3c7', countColor: '#d97706',
      });
    }

    const todayOrders = allOrders.filter((o: any) => (o.createdAt || '').startsWith(todayStr) && !['CANCELLED', 'REFUSED', 'COMPLETED'].includes(o.status));
    if (todayOrders.length > 0) {
      items.push({
        type: 'today', title: "Aujourd'hui",
        description: 'Commandes actives aujourd\'hui en cours de traitement.',
        count: `${todayOrders.length}`, link: '#',
        icon: <ShoppingBag className="h-5 w-5 text-blue-600" />,
        bg: '#eff6ff', border: '#bfdbfe', iconBg: '#dbeafe', countColor: '#2563eb',
      });
    }

    const recentCancelled = allOrders.filter((o: any) => ['CANCELLED', 'REFUSED'].includes(o.status) && (o.updatedAt || '') >= weekAgo);
    if (recentCancelled.length > 0) {
      items.push({
        type: 'cancelled', title: 'Annulations récentes',
        description: `${recentCancelled.length} commande(s) annulée(s) cette semaine.`,
        count: `${recentCancelled.length}`, link: '#',
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        bg: '#fef2f2', border: '#fecaca', iconBg: '#fee2e2', countColor: '#dc2626',
      });
    }

    const monthRevenue = allOrders
      .filter((o: any) => (o.createdAt || '') >= weekAgo && ['COMPLETED', 'DELIVERED'].includes(o.status))
      .reduce((a: number, o: any) => a + Number(o.totalAmount || 0), 0);
    if (monthRevenue > 0) {
      items.push({
        type: 'revenue', title: 'Revenu (7 jours)',
        description: 'Montant total des commandes terminées cette semaine.',
        count: `${monthRevenue.toLocaleString()} FCFA`, link: '#',
        icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
        bg: '#ecfdf5', border: '#a7f3d0', iconBg: '#d1fae5', countColor: '#059669',
      });
    }

    return items;
  }, [allOrders, todayStr, weekAgo]);

  const filtered = allOrders.filter((o: any) => {
    if (activeTab === 'today' && !(o.createdAt || '').startsWith(todayStr)) return false;
    if (!['all', 'today'].includes(activeTab) && o.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.business?.name || o.businessName || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Mes commandes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Consultez l&apos;historique de vos commandes</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/orders/stats"><Button variant="outline" size="sm"><Package className="h-4 w-4 mr-1.5" />Statistiques</Button></Link>
          <Link href="/dashboard/explore"><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouvelle commande</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-brand/10"><ShoppingBag className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500">Total</p><p className="text-sm font-bold text-gray-900 dark:text-white">{stats.total}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-emerald-100"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500">Aujourd'hui</p><p className="text-sm font-bold text-gray-900 dark:text-white">{stats.today}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-amber-100"><Clock className="w-4 h-4 text-amber-600" /></div><div><p className="text-[10px] text-gray-500">En attente</p><p className="text-sm font-bold text-gray-900 dark:text-white">{stats.pending}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-purple-100"><DollarSign className="w-4 h-4 text-purple-600" /></div><div><p className="text-[10px] text-gray-500">Total dépensé</p><p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(stats.totalSpent)}</p></div></div></Card>
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

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                activeTab === tab.key ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>{tab.label}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par n° commande, entreprise..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <ShoppingBag className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucune commande</h3>
          <p className="text-sm text-gray-500 mb-4">{search ? 'Essayez une autre recherche.' : 'Parcourez le marketplace pour passer votre première commande'}</p>
          <Link href="/dashboard/explore"><Button><Store className="h-4 w-4 mr-1.5" />Explorer le marketplace</Button></Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((order: any) => {
            const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const itemCount = order.items?.length || 0;
            const businessName = order.business?.name || order.businessName || '—';
            const isPending = order.status === 'PENDING';
            return (
              <div key={order.id} className="group">
                <div className="flex items-start gap-2">
                  <Link href={`/dashboard/orders/${order.id}`} className="flex-1 min-w-0">
                    <Card className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', s.color)}><ShoppingBag className="h-5 w-5" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{order.orderNumber || `#${order.id.slice(0, 8)}`}</h3>
                                <Badge variant={s.variant} size="xs">{s.label}</Badge>
                                <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{TYPE_LABELS[order.type] || order.type}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Store className="w-3 h-3" />{businessName}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(Number(order.totalAmount || 0))}</p>
                              <p className="text-[10px] text-gray-400">{itemCount} article{itemCount > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(order.createdAt || order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            {order.type === 'DELIVERY' && <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" />Livraison</span>}
                            {order.type === 'ON_SITE' && <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" />Sur place</span>}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors shrink-0 mt-2" />
                      </div>
                    </Card>
                  </Link>
                  {isPending && isBusiness && (
                    <button
                      onClick={() => setActionOrder(order)}
                      className="shrink-0 mt-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 transition-colors"
                      title="Traiter la commande"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Action Modal */}
      <OrderActionModal
        open={!!actionOrder}
        onClose={() => setActionOrder(null)}
        onSuccess={refetch}
        order={{
          id: actionOrder?.id || '',
          orderNumber: actionOrder?.orderNumber,
          totalAmount: actionOrder?.totalAmount,
          contactName: actionOrder?.contactName,
          contactPhone: actionOrder?.contactPhone,
          createdAt: actionOrder?.createdAt,
          items: actionOrder?.items,
        }}
      />
    </div>
  );
}
