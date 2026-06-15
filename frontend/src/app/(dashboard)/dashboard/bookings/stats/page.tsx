'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Users, XCircle, Clock, Loader, BarChart3, PieChart, Activity } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useMyBusinessBookings } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500',
  CONFIRMED: 'bg-blue-500',
  ARRIVED: 'bg-emerald-500',
  IN_PROGRESS: 'bg-purple-500',
  COMPLETED: 'bg-gray-400',
  CANCELLED: 'bg-red-400',
  NO_SHOW: 'bg-rose-400',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée', ARRIVED: 'Arrivé',
  IN_PROGRESS: 'En cours', COMPLETED: 'Terminée', CANCELLED: 'Annulée', NO_SHOW: 'No-show',
};

const TYPE_LABELS: Record<string, string> = {
  APPOINTMENT: 'Rendez-vous', ROOM: 'Chambre', TABLE: 'Restaurant',
  EVENT: 'Événement', CONSULTATION: 'Consultation', SERVICE: 'Service',
  SPACE: 'Espace', EQUIPMENT: 'Équipement', VEHICLE: 'Véhicule', TRAINING: 'Formation',
};

export default function BookingStatsPage() {
  const { data: bookingsData, isLoading } = useMyBusinessBookings({ limit: 500 });

  const allBookings = useMemo(() => {
    const raw = Array.isArray(bookingsData) ? bookingsData : (bookingsData?.bookings || bookingsData?.data || []);
    return raw.map((b: any) => ({
      ...b,
      priceNum: Number(b.price || 0),
      startDateObj: new Date(b.startDate || b.date),
    }));
  }, [bookingsData]);

  const stats = useMemo(() => {
    if (!allBookings.length) return null;

    const total = allBookings.length;
    const totalRevenue = allBookings.reduce((s: number, b: any) => s + b.priceNum, 0);
    const completed = allBookings.filter((b: any) => b.status === 'COMPLETED').length;
    const cancelled = allBookings.filter((b: any) => b.status === 'CANCELLED').length;
    const noShow = allBookings.filter((b: any) => b.status === 'NO_SHOW').length;
    const pending = allBookings.filter((b: any) => b.status === 'PENDING').length;
    const active = allBookings.filter((b: any) => ['CONFIRMED','ARRIVED','IN_PROGRESS'].includes(b.status)).length;

    const cancellationRate = total > 0 ? ((cancelled + noShow) / total * 100).toFixed(1) : '0';
    const completionRate = total > 0 ? (completed / total * 100).toFixed(1) : '0';

    // Revenue by day (last 30 days)
    const now = new Date();
    const last30Days: Record<string, number> = {};
    const dayCounts: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      last30Days[key] = 0;
      dayCounts[key] = 0;
    }
    allBookings.forEach((b: any) => {
      const key = b.startDateObj.toISOString().split('T')[0];
      if (last30Days[key] !== undefined) {
        last30Days[key] += b.priceNum;
        dayCounts[key]++;
      }
    });

    const revenueChart = Object.entries(last30Days).map(([date, revenue]) => ({ date, revenue: Math.round(revenue), count: dayCounts[date] || 0 }));
    const maxRevenue = Math.max(...revenueChart.map(r => r.revenue), 1);

    // Status distribution
    const statusDist = Object.entries(STATUS_LABELS).map(([key, label]) => ({
      key, label,
      count: allBookings.filter((b: any) => b.status === key).length,
    }));

    // Type distribution
    const typeMap: Record<string, number> = {};
    allBookings.forEach((b: any) => {
      const t = b.type || 'SERVICE';
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    const typeDist = Object.entries(typeMap)
      .map(([key, count]) => ({ key, label: TYPE_LABELS[key] || key, count }))
      .sort((a, b) => b.count - a.count);

    // Hour distribution
    const hourMap: Record<number, number> = {};
    allBookings.forEach((b: any) => {
      const h = b.startDateObj.getHours();
      hourMap[h] = (hourMap[h] || 0) + 1;
    });
    const hourDist = Array.from({ length: 24 }, (_, i) => ({
      hour: i, count: hourMap[i] || 0,
    }));

    // Average booking value
    const avgValue = total > 0 ? totalRevenue / total : 0;

    // Clients with most bookings
    const clientMap: Record<string, { name: string; count: number; revenue: number }> = {};
    allBookings.forEach((b: any) => {
      const key = b.customerPhone || b.customerEmail || b.customerName || 'unknown';
      if (!clientMap[key]) clientMap[key] = { name: b.customerName || key, count: 0, revenue: 0 };
      clientMap[key].count++;
      clientMap[key].revenue += b.priceNum;
    });
    const topClients = Object.values(clientMap).sort((a, b) => b.count - a.count).slice(0, 5);

    return {
      total, totalRevenue, completed, cancelled, noShow, pending, active,
      cancellationRate, completionRate, avgValue,
      revenueChart, maxRevenue, statusDist, typeDist, hourDist, topClients,
    };
  }, [allBookings]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!stats) return <div className="text-center py-12 text-gray-500">Aucune donnée disponible</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bookings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistiques</h1>
          <p className="text-sm text-gray-500">Analyse complète de vos réservations</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand/10"><Calendar className="w-4 h-4 text-brand" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Total</p><p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p></div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100"><Activity className="w-4 h-4 text-blue-600" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Actives</p><p className="text-lg font-bold text-gray-900 dark:text-white">{stats.active}</p></div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Revenu</p><p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(stats.totalRevenue)}</p></div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', stats.avgValue > 5000 ? 'bg-emerald-100' : 'bg-amber-100')}>
              <TrendingUp className={cn('w-4 h-4', stats.avgValue > 5000 ? 'text-emerald-600' : 'text-amber-600')} />
            </div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Moyen</p><p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(Math.round(stats.avgValue))}</p></div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100"><TrendingUp className="w-4 h-4 text-green-600" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Complétion</p><p className="text-lg font-bold text-gray-900 dark:text-white">{stats.completionRate}%</p></div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100"><XCircle className="w-4 h-4 text-red-600" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Annulation</p><p className="text-lg font-bold text-gray-900 dark:text-white">{stats.cancellationRate}%</p></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-brand" /><h3 className="font-semibold text-sm text-gray-900 dark:text-white">Revenus (30 jours)</h3></div>
            <span className="text-[10px] text-gray-400">{formatPrice(stats.totalRevenue)} total</span>
          </div>
          <div className="flex items-end gap-0.5 h-32 sm:h-40">
            {stats.revenueChart.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                {day.revenue > 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {formatPrice(day.revenue)}
                  </div>
                )}
                <div
                  className={cn('w-full rounded-t-sm transition-all duration-200 hover:opacity-80 cursor-pointer', day.revenue > 0 ? 'bg-brand' : 'bg-gray-100 dark:bg-gray-800')}
                  style={{ height: `${Math.max(day.revenue / stats.maxRevenue * 100, day.revenue > 0 ? 2 : 0)}%` }}
                />
                <span className="text-[7px] text-gray-400 mt-1 hidden sm:block">{new Date(day.date).getDate()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Status Distribution */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4"><PieChart className="w-4 h-4 text-brand" /><h3 className="font-semibold text-sm text-gray-900 dark:text-white">Par statut</h3></div>
          <div className="space-y-3">
            {stats.statusDist.map((s) => (
              s.count > 0 && (
                <div key={s.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{s.label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{s.count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', STATUS_COLORS[s.key] || 'bg-gray-400')}
                      style={{ width: `${(s.count / stats.total) * 100}%` }} />
                  </div>
                </div>
              )
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hour Distribution */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-brand" /><h3 className="font-semibold text-sm text-gray-900 dark:text-white">Heures populaires</h3></div>
          <div className="space-y-1.5">
            {stats.hourDist.filter(h => h.count > 0).sort((a, b) => b.count - a.count).slice(0, 8).map((h) => (
              <div key={h.hour} className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-gray-500 w-10">{String(h.hour).padStart(2, '0')}:00</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(h.count / Math.max(...stats.hourDist.map(x => x.count))) * 100}%` }} />
                </div>
                <span className="text-[10px] font-medium text-gray-900 dark:text-white w-6 text-right">{h.count}</span>
              </div>
            ))}
            {stats.hourDist.filter(h => h.count > 0).length === 0 && <p className="text-xs text-gray-400 text-center py-4">Aucune donnée</p>}
          </div>
        </Card>

        {/* Type Distribution */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-brand" /><h3 className="font-semibold text-sm text-gray-900 dark:text-white">Types populaires</h3></div>
          <div className="space-y-3">
            {stats.typeDist.slice(0, 6).map((t) => (
              <div key={t.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{t.label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{t.count}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${(t.count / stats.typeDist[0]?.count || 1) * 100}%` }} />
                </div>
              </div>
            ))}
            {stats.typeDist.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Aucune donnée</p>}
          </div>
        </Card>

        {/* Top Clients */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4"><Users className="w-4 h-4 text-brand" /><h3 className="font-semibold text-sm text-gray-900 dark:text-white">Meilleurs clients</h3></div>
          <div className="space-y-2">
            {stats.topClients.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white', 
                    i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-300 dark:bg-gray-600')}>
                    {i + 1}
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{c.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{c.count}×</p>
                  <p className="text-[9px] text-gray-400">{formatPrice(Math.round(c.revenue / c.count))}</p>
                </div>
              </div>
            ))}
            {stats.topClients.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Aucun client</p>}
          </div>
        </Card>
      </div>

      {/* Summary */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div><span className="text-gray-500">Total réservations :</span> <span className="font-semibold text-gray-900 dark:text-white">{stats.total}</span></div>
          <div><span className="text-gray-500">Terminées :</span> <span className="font-semibold text-green-600">{stats.completed}</span></div>
          <div><span className="text-gray-500">Annulées :</span> <span className="font-semibold text-red-600">{stats.cancelled}</span></div>
          <div><span className="text-gray-500">No-show :</span> <span className="font-semibold text-rose-600">{stats.noShow}</span></div>
          <div><span className="text-gray-500">Taux complétion :</span> <span className="font-semibold text-emerald-600">{stats.completionRate}%</span></div>
          <div><span className="text-gray-500">Panier moyen :</span> <span className="font-semibold text-brand">{formatPrice(Math.round(stats.avgValue))}</span></div>
        </div>
      </Card>
    </div>
  );
}
