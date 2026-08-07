'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Plus,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  DollarSign,
  Loader,
  Store,
  AlertTriangle,
  TrendingUp,
  FileText,
  User,
  MapPin,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { Drawer } from '@/components/ui/Drawer';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatPrice } from '@/utils/helpers';
import OrderActionModal from '@/components/orders/OrderActionModal';
import { CopilotTips } from '@/components/copilot/CopilotTips';

// ─── Configuration des statuts → LiveBadge (langage 2027 : temps réel) ───
const STATUS_CONFIG: Record<
  string,
  { label: string; tone: 'success' | 'danger' | 'warning' | 'brand' | 'muted'; pulse?: boolean }
> = {
  PENDING: { label: 'En attente', tone: 'warning', pulse: true },
  CONFIRMED: { label: 'Confirmée', tone: 'brand' },
  ACCEPTED: { label: 'Acceptée', tone: 'success' },
  PREPARING: { label: 'En préparation', tone: 'brand' },
  READY: { label: 'Prête', tone: 'success' },
  DELIVERING: { label: 'En livraison', tone: 'brand' },
  DELIVERED: { label: 'Livrée', tone: 'success' },
  COMPLETED: { label: 'Terminée', tone: 'muted' },
  REFUSED: { label: 'Refusée', tone: 'danger' },
  CANCELLED: { label: 'Annulée', tone: 'danger' },
  DISPUTE: { label: 'Litige', tone: 'danger', pulse: true },
};

const TYPE_LABELS: Record<string, string> = {
  DELIVERY: 'Livraison',
  ON_SITE: 'Sur place',
  CLICK_COLLECT: 'Click & Collect',
  PREORDER: 'Précommande',
  QUICK: 'Commande rapide',
  CUSTOM: 'Personnalisée',
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  DELIVERY: Truck,
  ON_SITE: Store,
  CLICK_COLLECT: Package,
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

function InfoStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-700/30 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value || '—'}</p>
    </div>
  );
}

function customerName(o: any): string {
  const b = o.buyer;
  if (b?.firstName || b?.lastName) return `${b.firstName || ''} ${b.lastName || ''}`.trim();
  return o.contactName || (o.buyerId ? 'Client' : 'Invité');
}

function customerDetail(o: any): string {
  const b = o.buyer;
  if (b?.email || b?.phone) return [b.email, b.phone].filter(Boolean).join(' · ');
  return o.contactPhone || '';
}

export default function OrdersPage() {
  const { user } = useAuthStore();
  const isBusiness = user?.roles?.includes('BUSINESS') || user?.primaryRole === 'BUSINESS';
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [actionOrder, setActionOrder] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await apiClient.exportBusinessOrdersCSV();
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commandes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export CSV error:', err);
    } finally {
      setExporting(false);
    }
  };

  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: isBusiness ? ['business', 'orders'] : ['orders'],
    queryFn: async () => {
      const res = await apiClient.get(
        isBusiness ? '/business/orders?limit=100' : '/orders?limit=100'
      );
      return res.data.data;
    },
    enabled: !!user,
    // Secours temps réel : le socket invalide déjà la query, ceci garantit la fraîcheur
    refetchInterval: 30_000,
  });

  const allOrders = Array.isArray(ordersData)
    ? ordersData
    : ordersData?.orders || ordersData?.data || [];
  const selectedOrder = allOrders.find((o: any) => o.id === selectedId) || null;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const stats = useMemo(() => {
    const todayOrders = allOrders.filter((o: any) => (o.createdAt || '').startsWith(todayStr));
    return {
      total: allOrders.length,
      today: todayOrders.length,
      pending: allOrders.filter((o: any) => o.status === 'PENDING').length,
      inProgress: allOrders.filter((o: any) =>
        ['PREPARING', 'READY', 'DELIVERING', 'ACCEPTED', 'CONFIRMED'].includes(o.status)
      ).length,
      revenueToday: todayOrders
        .filter((o: any) => !['CANCELLED', 'REFUSED'].includes(o.status))
        .reduce((a: number, o: any) => a + Number(o.totalAmount || 0), 0),
    };
  }, [allOrders, todayStr]);

  const filtered = allOrders.filter((o: any) => {
    if (activeTab === 'today' && !(o.createdAt || '').startsWith(todayStr)) return false;
    if (!['all', 'today'].includes(activeTab) && o.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (o.orderNumber || '').toLowerCase().includes(q) ||
        customerName(o).toLowerCase().includes(q) ||
        (o.business?.name || o.businessName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (error) {
    console.error('Orders fetch error:', error);
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Centre de traitement des commandes"
        description="Validez, préparez et suivez chaque commande en temps réel — de la réception à la livraison"
        breadcrumbs={
          [
            { label: 'Dashboard', href: '/dashboard' },
            ...(isBusiness ? [{ label: 'Business', href: '/dashboard/business' }] : []),
            { label: 'Commandes' },
          ] as { label: string; href?: string }[]
        }
        actions={
          <div className="flex items-center gap-2">
            {isBusiness && (
              <>
                <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={exporting}>
                  {exporting ? (
                    <Loader className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4 mr-1.5" />
                  )}
                  Export CSV
                </Button>
                <Link href="/dashboard/orders/stats">
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-1.5" />
                    Statistiques
                  </Button>
                </Link>
              </>
            )}
            <Link href={isBusiness ? '/dashboard/business/orders/new' : '/dashboard/explore'}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Nouvelle commande
              </Button>
            </Link>
          </div>
        }
      />

      <CopilotTips moduleKey="ORDERS" />

      {/* KPIs temps réel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
          label="En attente de traitement"
          value={stats.pending}
          trend={
            stats.pending > 0
              ? { value: 'à traiter', positive: false }
              : { value: 'à jour', positive: true }
          }
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-sky-50 dark:bg-sky-900/30"
          iconColor="text-sky-600 dark:text-sky-400"
          label="Reçues aujourd'hui"
          value={stats.today}
        />
        <StatsCard
          icon={<Package className="h-5 w-5" />}
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          label="En cours"
          value={stats.inProgress}
        />
        <StatsCard
          icon={<DollarSign className="h-5 w-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          label="CA aujourd'hui"
          value={`${stats.revenueToday.toLocaleString('fr-FR')} FCFA`}
        />
      </div>

      {/* Barre live + filtres */}
      <Card padding="md">
        <div className="flex items-center justify-between gap-3 mb-4">
          <LiveBadge tone="success" label="Temps réel" value={`${stats.pending} en attente`} />
          <p className="text-xs text-gray-400 hidden sm:block">
            Les nouvelles commandes apparaissent instantanément
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  activeTab === tab.key
                    ? 'bg-brand text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="N° commande, client, entreprise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
            />
          </div>
        </div>
      </Card>

      {/* Table dense */}
      {filtered.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8" />}
            title="Aucune commande"
            description={
              search || activeTab !== 'all'
                ? 'Aucune commande ne correspond à ce filtre.'
                : "Les commandes de vos clients apparaîtront ici en temps réel dès qu'elles seront passées."
            }
            action={
              <Link href="/dashboard/explore">
                <Button size="sm">
                  <Store className="h-4 w-4 mr-1.5" />
                  Explorer le marketplace
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Commande</th>
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium text-right">Montant</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order: any) => {
                  const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                  const isPending = order.status === 'PENDING';
                  const TypeIcon = TYPE_ICONS[order.type] || ShoppingBag;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedId(order.id)}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="min-w-[170px]">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {order.orderNumber || `#${order.id.slice(0, 8)}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt || order.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="min-w-[160px]">
                          <p className="text-gray-900 dark:text-gray-100 font-medium truncate">
                            {customerName(order)}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {customerDetail(order) || '—'}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          <TypeIcon className="h-3.5 w-3.5 text-gray-400" />
                          {TYPE_LABELS[order.type] || order.type || '—'}
                        </span>
                      </td>
                      <td className="p-4">
                        <LiveBadge tone={s.tone} label={s.label} pulse={s.pulse} />
                      </td>
                      <td className="p-4 text-right">
                        <p className="font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          {formatPrice(Number(order.totalAmount || 0))}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}
                        </p>
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && isBusiness ? (
                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => setActionOrder(order)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Traiter
                            </Button>
                          ) : (
                            <Button variant="ghost" size="xs" onClick={() => setSelectedId(order.id)}>
                              <ChevronRight className="h-3.5 w-3.5" />
                              Détail
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Drawer 360° commande */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedId(null)}
        icon={<ShoppingBag className="h-5 w-5" />}
        title={selectedOrder?.orderNumber || 'Commande'}
        subtitle={
          selectedOrder
            ? `${new Date(selectedOrder.createdAt || selectedOrder.date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : undefined
        }
        footer={
          selectedOrder && isBusiness ? (
            <div className="flex flex-wrap gap-2">
              {selectedOrder.status === 'PENDING' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActionOrder(selectedOrder);
                    setSelectedId(null);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Traiter la commande
                </Button>
              )}
              {selectedOrder.invoice && (
                <Link href="/dashboard/accounting">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4" />
                    Voir la facture
                  </Button>
                </Link>
              )}
            </div>
          ) : undefined
        }
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Statut + facture */}
            <div className="flex items-center justify-between gap-3">
              {(() => {
                const s = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG.PENDING;
                return <LiveBadge tone={s.tone} label={s.label} pulse={s.pulse} />;
              })()}
              {selectedOrder.invoice && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <FileText className="h-3 w-3" />
                  {selectedOrder.invoice.invoiceNumber}
                </span>
              )}
            </div>

            {/* Client */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Client
              </p>
              <div className="grid grid-cols-2 gap-3">
                <InfoStat icon={User} label="Nom" value={customerName(selectedOrder)} />
                <InfoStat
                  icon={Clock}
                  label="Type"
                  value={TYPE_LABELS[selectedOrder.type] || selectedOrder.type}
                />
                <InfoStat
                  icon={Package}
                  label="Contact"
                  value={
                    selectedOrder.contactPhone ||
                    selectedOrder.buyer?.phone ||
                    selectedOrder.buyer?.email ||
                    '—'
                  }
                />
                <InfoStat
                  icon={MapPin}
                  label="Zone de livraison"
                  value={
                    selectedOrder.deliveryZone?.name
                      ? `${selectedOrder.deliveryZone.name}${
                          Number(selectedOrder.deliveryZone.fee) > 0
                            ? ` · ${formatPrice(Number(selectedOrder.deliveryZone.fee))}`
                            : ''
                        }`
                      : selectedOrder.address || '—'
                  }
                />
              </div>
            </div>

            {/* Articles */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Articles ({selectedOrder.items?.length || 0})
              </p>
              {selectedOrder.items?.length ? (
                <div className="space-y-1.5">
                  {selectedOrder.items.map((item: any, i: number) => (
                    <div
                      key={item.id || i}
                      className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.name || item.productName || 'Article'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.quantity} × {formatPrice(Number(item.unitPrice || 0))}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                        {formatPrice(Number(item.total || item.quantity * (item.unitPrice || 0)))}
                      </p>
                    </div>
                  ))}
                  {selectedOrder.deliveryZone &&
                    Number(selectedOrder.deliveryZone.fee) > 0 && (
                      <div className="flex items-center justify-between px-3 py-1.5 text-sm">
                        <span className="text-gray-500">Livraison</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatPrice(Number(selectedOrder.deliveryZone.fee))}
                        </span>
                      </div>
                    )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Aucun article détaillé</p>
              )}
            </div>

            {/* Total */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total de la commande
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(Number(selectedOrder.totalAmount || 0))}
              </span>
            </div>
          </div>
        )}
      </Drawer>

      {/* Action modal (flux existant : accepter / refuser / confirmer) */}
      {actionOrder && (
        <OrderActionModal
          open={!!actionOrder}
          onClose={() => setActionOrder(null)}
          onSuccess={() => {
            refetch();
            qc.invalidateQueries({ queryKey: ['business', 'orders'] });
          }}
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
      )}
    </div>
  );
}
