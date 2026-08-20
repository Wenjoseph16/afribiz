'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface OrdersDonutChartProps {
  delivered: number;
  confirmed: number;
  pending: number;
  cancelled: number;
}

const COLORS = {
  delivered: '#10b981',
  confirmed: '#3b82f6',
  pending: '#f59e0b',
  cancelled: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  delivered: 'Livrées',
  confirmed: 'Confirmées',
  pending: 'En attente',
  cancelled: 'Annulées',
};

export function OrdersDonutChart({
  delivered,
  confirmed,
  pending,
  cancelled,
}: OrdersDonutChartProps) {
  const data = useMemo(() => {
    const items = [
      { name: 'Livrées', value: delivered, color: COLORS.delivered },
      { name: 'Confirmées', value: confirmed, color: COLORS.confirmed },
      { name: 'En attente', value: pending, color: COLORS.pending },
      { name: 'Annulées', value: cancelled, color: COLORS.cancelled },
    ].filter((d) => d.value > 0);
    return items.length > 0 ? items : [{ name: 'Aucune', value: 1, color: '#E2E8F0' }];
  }, [delivered, confirmed, pending, cancelled]);

  const total = delivered + confirmed + pending + cancelled;

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400 mb-3">
        Répartition commandes
      </p>

      <div className="flex items-center gap-4">
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={48}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [
                  `${Number(value)} commande${Number(value) > 1 ? 's' : ''}`,
                  String(name),
                ]}
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  fontSize: 12,
                  background: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {data.map((d) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            return (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-slate-600">{d.name}</span>
                </div>
                <span className="font-semibold text-slate-800 tabular-nums">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
