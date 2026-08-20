'use client';

import { useMemo } from 'react';
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

  if (!hasRevenue && !hasOrders && !hasStatus) return null;

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
