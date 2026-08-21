'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface RevenueAreaChartProps {
  data: Array<{ label: string; value: number }>;
  total?: number;
}

export function RevenueAreaChart({ data, total }: RevenueAreaChartProps) {
  const chartTotal = useMemo(
    () => total ?? data.reduce((sum, d) => sum + d.value, 0),
    [data, total]
  );

  const areaId = 'grad-revenue-7d';

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            CA 7 jours
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {chartTotal.toLocaleString('fr-FR')} FCFA
          </p>
        </div>
        <div className="p-2 rounded-xl bg-emerald-50">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.4} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
            />
            <Tooltip
              formatter={(value: any) => [
                `${Number(value).toLocaleString('fr-FR')} FCFA`,
                'Revenu',
              ]}
              contentStyle={{
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                fontSize: 12,
                background: '#fff',
              }}
              cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fill={`url(#${areaId})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
