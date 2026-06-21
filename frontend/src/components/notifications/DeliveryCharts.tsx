'use client';

import { BarChart3, Activity, Mail } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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

function PieLabelSmall({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

interface ReadBarProps {
  read: number;
  unread: number;
}

export function ReadBarChart({ read, unread }: ReadBarProps) {
  return (
    <Card padding="lg">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-emerald-600" />
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Lecture
        </h3>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[
              { name: 'Lues', value: read || 0, fill: '#10b981' },
              { name: 'Non lues', value: unread || 0, fill: '#f59e0b' },
            ]}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Notifications">
              <Cell fill="#10b981" />
              <Cell fill="#f59e0b" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

interface DeliveryPieProps {
  sent: number;
  failed: number;
  pending: number;
}

export function DeliveryPieChart({ sent, failed, pending }: DeliveryPieProps) {
  const total = sent + failed + pending;
  if (total === 0) {
    return (
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Livraison
          </h3>
        </div>
        <div className="h-56 flex items-center justify-center">
          <p className="text-sm text-gray-400">Aucune donnée de livraison</p>
        </div>
      </Card>
    );
  }

  const deliveryData = [
    { name: 'Envoyées', value: sent, color: '#10b981' },
    { name: 'Échouées', value: failed, color: '#ef4444' },
    { name: 'En attente', value: pending, color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  return (
    <Card padding="lg">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-brand" />
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Livraison
        </h3>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={deliveryData}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              label={PieLabelSmall}
              labelLine={false}
            >
              {deliveryData.map((entry: any, index: number) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-xs text-gray-500 dark:text-gray-400">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

interface ChannelBarProps {
  channels: Array<{ channel: string; count: number }>;
}

export function ChannelBarChart({ channels }: ChannelBarProps) {
  if (!channels.length) {
    return (
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-4 w-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Canaux
          </h3>
        </div>
        <div className="h-56 flex items-center justify-center">
          <p className="text-sm text-gray-400">Aucune donnée de canal</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="h-4 w-4 text-purple-600" />
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Canaux
        </h3>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={channels.map((t) => ({
              ...t,
              channel:
                t.channel === 'IN_APP'
                  ? 'App'
                  : t.channel === 'EMAIL'
                    ? 'Email'
                    : t.channel === 'SMS'
                      ? 'SMS'
                      : t.channel,
            }))}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis dataKey="channel" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Notifications">
              {channels.map((_: any, idx: number) => (
                <Cell key={idx} fill={['#6366f1', '#10b981', '#f59e0b'][idx % 3]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
