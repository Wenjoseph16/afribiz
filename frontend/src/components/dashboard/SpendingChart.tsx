'use client';

import { useMemo } from 'react';
import { Wallet } from 'lucide-react';
import { TrendAreaChart, type ChartMetric } from '@/components/dashboard/TrendAreaChart';
import { cn } from '@/lib/utils';

interface Props {
  orders: Array<{
    totalAmount?: number | string;
    createdAt?: string;
    status?: string;
  }>;
}

const MONTHS = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

const STATUS_LABELS: Record<string, string> = {
  DELIVERED: 'Livrées',
  COMPLETED: 'Terminées',
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  CONFIRMED: 'Confirmées',
  CANCELLED: 'Annulées',
  REFUNDED: 'Remboursées',
};

/** Construit les buckets mensuels sur N mois à partir des commandes. */
function buildMonthlyData(orders: Props['orders'], months: number) {
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (months - 1 - i));
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTHS[d.getMonth()],
      value: 0,
    };
  });

  for (const o of orders) {
    if (!o.createdAt) continue;
    const d = new Date(o.createdAt);
    const bucket = buckets.find((b) => b.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (bucket) bucket.value += Number(o.totalAmount) || 0;
  }

  return buckets;
}

/** Répartition du nombre de commandes par statut (métriques à barres). */
function buildStatusMetrics(orders: Props['orders']): ChartMetric[] {
  if (orders.length === 0) return [];
  const counts = new Map<string, number>();
  for (const o of orders) {
    const key = STATUS_LABELS[o.status || ''] || o.status || 'Autres';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const total = orders.length;
  const ordered = ['Livrées', 'Terminées', 'Confirmées', 'En cours', 'En attente', 'Annulées'];
  return ordered
    .filter((label) => counts.has(label))
    .map((label) => ({
      label,
      value: Math.round(((counts.get(label) || 0) / total) * 100),
      hint: `${counts.get(label)}/${total}`,
    }));
}

export function SpendingChart({ orders }: Props) {
  const data6 = useMemo(() => buildMonthlyData(orders, 6), [orders]);
  const data12 = useMemo(() => buildMonthlyData(orders, 12), [orders]);
  const hasData = data6.some((b) => b.value > 0);
  const metrics = useMemo(() => buildStatusMetrics(orders), [orders]);

  if (!hasData) {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-800/90 p-6 shadow-sm border border-slate-200/70 dark:border-gray-700/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Mes dépenses
              </h3>
              <p className="text-xs text-muted-foreground">6 derniers mois</p>
            </div>
          </div>
        </div>
        <div
          className={cn(
            'flex flex-col items-center justify-center h-48 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center px-6'
          )}
        >
          <Wallet className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-muted-foreground">Pas encore de dépenses</p>
          <p className="text-xs text-gray-400 mt-1">
            Vos commandes apparaîtront ici sous forme de graphique.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TrendAreaChart
      title="Mes dépenses"
      subtitle="Évolution mensuelle de vos achats"
      data={data12}
      dataKeyLabel="Dépensé"
      color="#16A34A"
      periodOptions={[
        { label: '6 mois', value: '6' },
        { label: '12 mois', value: '12' },
      ]}
      metrics={metrics}
      metricsTitle="Répartition des commandes"
    />
  );
}
