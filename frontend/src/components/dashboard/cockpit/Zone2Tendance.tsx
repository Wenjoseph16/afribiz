'use client';

import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { RevenueAreaChart } from './RevenueAreaChart';
import { OrdersDonutChart } from './OrdersDonutChart';
import { OrdersBarChart } from './OrdersBarChart';

/** History entry from GET /business/stats/aggregated → history[] */
interface HistoryEntry {
  date: string;
  revenue: number;
  orders: number;
}

export interface Zone2Props {
  history: HistoryEntry[];
  orderStatusBreakdown?: {
    delivered: number;
    confirmed: number;
    pending: number;
    cancelled: number;
  };
}

export function Zone2Tendance({ history, orderStatusBreakdown }: Zone2Props) {
  // Format history for charts
  const revenueData = useMemo(
    () =>
      history.map((h) => ({
        label: new Date(h.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
        value: h.revenue,
      })),
    [history]
  );

  const ordersData = useMemo(
    () =>
      history.map((h) => ({
        label: new Date(h.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
        value: h.orders,
      })),
    [history]
  );

  const status = orderStatusBreakdown ?? {
    delivered: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
  };

  // Don't render if all data is empty
  const hasRevenue = history.some((h) => h.revenue > 0);
  const hasOrders = history.some((h) => h.orders > 0);
  const hasStatus = status.delivered + status.confirmed + status.pending + status.cancelled > 0;

  if (!hasRevenue && !hasOrders && !hasStatus) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200/70 p-8 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="h-6 w-6 text-emerald-400" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Vos graphiques apparaîtront ici</p>
        <p className="text-xs text-slate-400 mt-1">
          Les tendances de votre chiffre d'affaires et commandes s'afficheront dès vos premières ventes.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {hasRevenue && (
        <div className="lg:col-span-1">
          <RevenueAreaChart data={revenueData} />
        </div>
      )}
      {hasStatus && (
        <div className="lg:col-span-1">
          <OrdersDonutChart {...status} />
        </div>
      )}
      {hasOrders && (
        <div className="lg:col-span-1">
          <OrdersBarChart data={ordersData} />
        </div>
      )}
    </div>
  );
}
