'use client';

import { AlertTriangle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card } from '@/components/ui/Card';

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>
            {entry.name}:{' '}
            <strong>{typeof entry.value === 'number' ? `${entry.value}%` : entry.value}</strong>
          </span>
        </p>
      ))}
    </div>
  );
}

interface FailureDataPoint {
  date: string;
  rate: number;
  total: number;
  failed: number;
}

export function FailureRateChart({
  data,
  threshold = 10,
}: {
  data: FailureDataPoint[];
  threshold?: number;
}) {
  if (!data.length) {
    return (
      <Card className="lg:col-span-2" padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Taux d'échec
          </h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm text-gray-400">Aucune donnée de taux d'échec disponible</p>
        </div>
      </Card>
    );
  }

  const maxRate = Math.max(...data.map((d) => d.rate), threshold + 5);

  return (
    <Card className="lg:col-span-2" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Taux d'échec
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-xs text-gray-400">Échec</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-px h-4 border-r-2 border-dashed border-red-500" />
            <span className="text-xs text-gray-400">Seuil {threshold}%</span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="failureGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              stroke="#9ca3af"
              tickFormatter={(v) => {
                const d = new Date(v + 'T00:00:00');
                return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
              }}
              interval={Math.max(0, Math.floor(data.length / 8) - 1)}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
              domain={[0, maxRate]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine
              y={threshold}
              stroke="#ef4444"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `Seuil ${threshold}%`,
                position: 'right',
                fill: '#ef4444',
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#ef4444"
              fill="url(#failureGradient)"
              strokeWidth={2}
              name="Taux d'échec"
              dot={{ r: 3, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
