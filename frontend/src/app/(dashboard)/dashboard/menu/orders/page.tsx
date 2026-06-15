'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Clock, CheckCircle, XCircle, ChefHat, Bike, PackageCheck, Eye, Loader, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/utils/helpers';
import { useMenuOrders, useUpdateMenuOrderStatus, useMenuOrderStats } from '@/features/hooks';
import { useQueryClient } from '@tanstack/react-query';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; nextActions?: { status: string; label: string; color: string }[] }> = {
  PENDING: { label: 'En attente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock, nextActions: [
    { status: 'ACCEPTED', label: 'Accepter', color: 'bg-emerald-500 hover:bg-emerald-600' },
    { status: 'CANCELLED', label: 'Refuser', color: 'bg-red-500 hover:bg-red-600' },
  ]},
  ACCEPTED: { label: 'Acceptée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle, nextActions: [
    { status: 'PREPARING', label: 'Lancer préparation', color: 'bg-purple-500 hover:bg-purple-600' },
  ]},
  PREPARING: { label: 'En préparation', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: ChefHat, nextActions: [
    { status: 'READY', label: 'Marquer prête', color: 'bg-emerald-500 hover:bg-emerald-600' },
  ]},
  READY: { label: 'Prête', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: PackageCheck, nextActions: [
    { status: 'COMPLETED', label: 'Terminer', color: 'bg-blue-500 hover:bg-blue-600' },
  ]},
  DELIVERING: { label: 'En livraison', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: Bike, nextActions: [
    { status: 'DELIVERED', label: 'Marquer livrée', color: 'bg-emerald-500 hover:bg-emerald-600' },
  ]},
  DELIVERED: { label: 'Livrée', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: PackageCheck, nextActions: [
    { status: 'COMPLETED', label: 'Terminer', color: 'bg-blue-500 hover:bg-blue-600' },
  ]},
  COMPLETED: { label: 'Terminée', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', icon: CheckCircle },
  CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

const ORDER_TABS = [
  { key: 'active', label: 'Actives' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'PREPARING', label: 'En préparation' },
  { key: 'READY', label: 'Prêtes' },
  { key: 'COMPLETED', label: 'Terminées' },
  { key: 'CANCELLED', label: 'Annulées' },
];

export default function MenuOrdersPage() {
  const qc = useQueryClient();
  const { data: ordersData, isLoading } = useMenuOrders();
  const { data: statsData } = useMenuOrderStats();
  const updateStatus = useUpdateMenuOrderStatus();
  const [activeTab, setActiveTab] = useState('active');
  const [search, setSearch] = useState('');

  const allOrders = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || ordersData?.data || []);
  const stats = statsData || {};
  const activeStatuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERING'];

  const filtered = allOrders.filter((o: any) => {
    if (activeTab === 'active' && !activeStatuses.includes(o.status)) return false;
    if (activeTab !== 'active' && o.status !== activeTab) return false;
    if (search && !o.orderNumber?.toLowerCase().includes(search.toLowerCase()) && !(o.customerName || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id: orderId, status });
      qc.invalidateQueries({ queryKey: ['my-menu', 'orders'] });
    } catch (e) { console.error(e); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/menu" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Commandes restaurant</h1><p className="text-sm text-gray-500">Gérez les commandes</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'En attente', value: stats.pending || allOrders.filter((o: any) => o.status === 'PENDING').length, color: 'text-amber-600 bg-amber-100' },
          { label: 'En préparation', value: stats.preparing || allOrders.filter((o: any) => o.status === 'PREPARING').length, color: 'text-purple-600 bg-purple-100' },
          { label: 'Prêtes', value: stats.ready || allOrders.filter((o: any) => o.status === 'READY').length, color: 'text-emerald-600 bg-emerald-100' },
          { label: 'Revenu', value: formatPrice(stats.todayRevenue || 0), color: 'text-blue-600 bg-blue-100' },
        ].map((s) => (
          <Card key={s.label} className="p-3"><div className="flex items-center gap-2"><div className={cn('p-1.5 rounded-lg', s.color)}><Clock className="w-3.5 h-3.5" /></div><div><p className="text-xs text-gray-500">{s.label}</p><p className="text-sm font-bold text-gray-900 dark:text-white">{s.value}</p></div></div></Card>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {ORDER_TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap', activeTab === tab.key ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300')}>{tab.label}</button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-10" />
      </div>

      <div className="space-y-3">
        {filtered.map((order: any) => {
          const status = STATUS_CONFIG[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600', icon: Clock };
          const StatusIcon = status.icon;
          return (
            <Card key={order.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white">{order.orderNumber || 'CMD-' + order.id.slice(0, 8)}</span>
                    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1', status.color)}><StatusIcon className="w-3 h-3" />{status.label}</span>
                    <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {order.table && <span>Table {order.table.tableNumber || order.table}</span>}
                    {order.customerName && <span>• {order.customerName}</span>}
                    {order.type && <span>• {order.type}</span>}
                  </div>
                </div>
                <span className="font-bold text-brand text-lg">{formatPrice(Number(order.total || 0))}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {(order.items || []).map((item: any, i: number) => (
                  <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">{item.name} x{item.quantity}</span>
                ))}
              </div>
              {status.nextActions && (
                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  {status.nextActions.map((action) => (
                    <Button key={action.status} size="sm" onClick={() => handleStatusUpdate(order.id, action.status)}
                      className={cn('text-white text-xs', action.color)}
                      isLoading={updateStatus.isPending}>
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Utensils className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune commande</p>
          </div>
        )}
      </div>
    </div>
  );
}
