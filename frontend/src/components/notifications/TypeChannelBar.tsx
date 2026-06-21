'use client';

import { BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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

export function TypeChannelBarChart({ data, channels }: { data: any[]; channels: string[] }) {
  if (!data.length) return null;

  return (
    <Card padding="lg">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-brand" />
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Types par canal
        </h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis dataKey="type" tick={{ fontSize: 10 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              formatter={(value: string) => (
                <span className="text-xs text-gray-500 dark:text-gray-400">{value}</span>
              )}
            />
            {channels.map((ch: string, idx: number) => (
              <Bar
                key={ch}
                dataKey={ch}
                stackId="a"
                fill={['#6366f1', '#10b981', '#f59e0b'][idx % 3]}
                name={
                  ch === 'IN_APP' ? 'App' : ch === 'EMAIL' ? 'Email' : ch === 'SMS' ? 'SMS' : ch
                }
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
