'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, DollarSign, TrendingUp, XCircle, Clock, Loader, Package, BarChart3, PieChart, Activity } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useOrders } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500', CONFIRMED: 'bg-blue-500', ACCEPTED: 'bg-emerald-500',
  PREPARING: 'bg-purple-500', READY: 'bg-teal-500', DELIVERING: 'bg-indigo-500',
  DELIVERED: 'bg-emerald-500', COMPLETED: 'bg-gray-400', REFUSED: 'bg-red-400',
  CANCELLED: 'bg-red-400', DISPUTE: 'bg-rose-400',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée', ACCEPTED: 'Acceptée',
  PREPARING: 'Préparation', READY: 'Prête', DELIVERING: 'Livraison',
  DELIVERED: 'Livrée', COMPLETED: 'Terminée', REFUSED: 'Refusée',
  CANCELLED: 'Annulée', DISPUTE: 'Litige',
};

const TYPE_LABELS: Record<string, string> = {
  DELIVERY: 'Livraison', ON_SITE: 'Sur place', CLICK_COLLECT: 'Click & Collect',
  PREORDER: 'Précommande', QUICK: 'Rapide', CUSTOM: 'Personnalisée',
};

export default function OrderStatsPage() {
  const { data: ordersData, isLoading } = useOrders({ limit: 500 });

  const allOrders = useMemo(() => {
    const raw = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || ordersData?.data || []);
    return raw.map((o: any) => ({ ...o, amountNum: Number(o.totalAmount || 0), createdAtObj: new Date(o.createdAt || o.date) }));
  }, [ordersData]);

  const stats = useMemo(() => {
    if (!allOrders.length) return null;
    const total = allOrders.length;
    const totalSpent = allOrders.reduce((s: number, o: any) => s + o.amountNum, 0);
    const delivered = allOrders.filter((o: any) => ['DELIVERED', 'COMPLETED'].includes(o.status)).length;
    const cancelled = allOrders.filter((o: any) => ['CANCELLED', 'REFUSED'].includes(o.status)).length;
    const pending = allOrders.filter((o: any) => o.status === 'PENDING').length;
    const active = allOrders.filter((o: any) => ['ACCEPTED', 'PREPARING', 'READY', 'DELIVERING'].includes(o.status)).length;
    const avgValue = total > 0 ? totalSpent / total : 0;

    // Spending by day (last 30 days)
    const now = new Date();
    const last30Days: Record<string, number> = {};
    const dayCounts: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      last30Days[key] = 0; dayCounts[key] = 0;
    }
    allOrders.forEach((o: any) => {
      const key = o.createdAtObj.toISOString().split('T')[0];
      if (last30Days[key] !== undefined) { last30Days[key] += o.amountNum; dayCounts[key]++; }
    });

    const spendingChart = Object.entries(last30Days).map(([date, amount]) => ({ date, amount: Math.round(amount), count: dayCounts[date] || 0 }));
    const maxAmount = Math.max(...spendingChart.map(r => r.amount), 1);

    // Status distribution
    const statusDist = Object.entries(STATUS_LABELS).map(([key, label]) => ({ key, label, count: allOrders.filter((o: any) => o.status === key).length }));

    // Type distribution
    const typeMap: Record<string, number> = {};
    allOrders.forEach((o: any) => { const t = o.type || 'DELIVERY'; typeMap[t] = (typeMap[t] || 0) + 1; });
    const typeDist = Object.entries(typeMap).map(([key, count]) => ({ key, label: TYPE_LABELS[key] || key, count })).sort((a, b) => b.count - a.count);

    return { total, totalSpent, delivered, cancelled, pending, active, avgValue, spendingChart, maxAmount, statusDist, typeDist };
  }, [allOrders]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!stats) return <div className="text-center py-12 text-gray-500">Aucune donnée disponible</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistiques</h1><p className="text-sm text-gray-500">Analyse de vos commandes</p></div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-brand/10"><ShoppingBag className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500 uppercase">Total</p><p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100"><Activity className="w-4 h-4 text-blue-600" /></div><div><p className="text-[10px] text-gray-500 uppercase">Actives</p><p className="text-lg font-bold text-gray-900 dark:text-white">{stats.active}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-100"><DollarSign className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500 uppercase">Dépensé</p><p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(stats.totalSpent)}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-3"><div className={cn('p-2 rounded-lg', stats.avgValue > 5000 ? 'bg-emerald-100' : 'bg-amber-100')}><TrendingUp className={cn('w-4 h-4', stats.avgValue > 5000 ? 'text-emerald-600' : 'text-amber-600')} /></div><div><p className="text-[10px] text-gray-500 uppercase">Moyen</p><p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(Math.round(stats.avgValue))}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-100"><Package className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500 uppercase">Reçues</p><p className="text-lg font-bold text-gray-900 dark:text-white">{stats.delivered}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-100"><XCircle className="w-4 h-4 text-red-600" /></div><div><p className="text-[10px] text-gray-500 uppercase">Annulées</p><p className="text-lg font-bold text-gray-900 dark:text-white">{stats.cancelled}</p></div></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Chart */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-brand" /><h3 className="font-semibold text-sm text-gray-900 dark:text-white">Dépenses (30 jours)</h3></div><span className="text-[10px] text-gray-400">{formatPrice(stats.totalSpent)} total</span></div>
          <div className="flex items-end gap-0.5 h-32 sm:h-40">
            {stats.spendingChart.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                {day.amount > 0 && <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{formatPrice(day.amount)}</div>}
                <div className={cn('w-full rounded-t-sm transition-all duration-200 hover:opacity-80 cursor-pointer', day.amount > 0 ? 'bg-brand' : 'bg-gray-100 dark:bg-gray-800')}
                  style={{ height: `${Math.max(day.amount / stats.maxAmount * 100, day.amount > 0 ? 2 : 0)}%` }} />
                <span className="text-[7px] text-gray-400 mt-1 hidden sm:block">{new Date(day.date).getDate()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Status Distribution */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4"><PieChart className="w-4 h-4 text-brand" /><h3 className="font-semibold text-sm text-gray-900 dark:text-white">Par statut</h3></div>
          <div className="space-y-3">
            {stats.statusDist.filter(s => s.count > 0).map((s) => (
              <div key={s.key}>
                <div className="flex justify-between text-xs mb-1"><span className="text-gray-600 dark:text-gray-400">{s.label}</span><span className="font-medium text-gray-900 dark:text-white">{s.count}</span></div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', STATUS_COLORS[s.key] || 'bg-gray-400')} style={{ width: `${(s.count / stats.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Distribution */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-brand" /><h3 className="font-semibold text-sm text-gray-900 dark:text-white">Types de commandes</h3></div>
          <div className="space-y-3">
            {stats.typeDist.slice(0, 6).map((t) => (
              <div key={t.key}>
                <div className="flex justify-between text-xs mb-1"><span className="text-gray-600 dark:text-gray-400">{t.label}</span><span className="font-medium text-gray-900 dark:text-white">{t.count}</span></div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${(t.count / stats.typeDist[0]?.count || 1) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
