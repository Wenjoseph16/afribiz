'use client';

import { Activity } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
            <strong>
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </strong>
          </span>
        </p>
      ))}
    </div>
  );
}

const formatDate = (d: string) => {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

interface VolumeDataPoint {
  date: string;
  count: number;
  read: number;
  unread: number;
}

export function VolumeChart({ data }: { data: VolumeDataPoint[] }) {
  return (
    <Card className="lg:col-span-2" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Volume quotidien
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-brand/60" />
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-400">Lues</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-xs text-gray-400">Non lues</span>
          </div>
        </div>
      </div>
      {data.length > 0 ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="readGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="unreadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
                tickFormatter={(v) => formatDate(v)}
                interval={Math.max(0, Math.floor(data.length / 10) - 1)}
              />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                fill="url(#volumeGradient)"
                strokeWidth={2}
                name="Total"
              />
              <Area
                type="monotone"
                dataKey="read"
                stroke="#10b981"
                fill="url(#readGradient)"
                strokeWidth={2}
                name="Lues"
              />
              <Area
                type="monotone"
                dataKey="unread"
                stroke="#f59e0b"
                fill="url(#unreadGradient)"
                strokeWidth={2}
                name="Non lues"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-72 flex items-center justify-center">
          <p className="text-sm text-gray-400">Aucune donnée de volume disponible</p>
        </div>
      )}
    </Card>
  );
}
