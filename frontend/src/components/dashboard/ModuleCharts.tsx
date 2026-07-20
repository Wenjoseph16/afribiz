'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
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
  Legend,
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#f97316'];

// ── Types ──
export interface ModuleChartData {
  trend?: { label: string; value: number; secondary?: number }[];
  distribution?: { name: string; value: number; color?: string }[];
  daily?: { label: string; value: number }[];
}

interface ModuleChartsProps {
  title?: string;
  data: ModuleChartData;
  trendLabel?: string;
  trendUnit?: string;
  distributionLabel?: string;
  dailyLabel?: string;
  trendColor?: string;
  variant?: 'products' | 'services' | 'menu' | 'events' | 'rooms' | 'default';
}

const VARIANT_COLORS: Record<string, string> = {
  products: '#6366f1',
  services: '#8b5cf6',
  menu: '#f59e0b',
  events: '#ef4444',
  rooms: '#06b6d4',
  default: '#6366f1',
};

// ── Tooltip ──
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm">
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

// ── Pie Label ──
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
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
      fontSize={11}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function ModuleCharts({
  title,
  data,
  trendLabel = 'Tendance',
  trendUnit = '',
  distributionLabel = 'Répartition',
  dailyLabel = 'Quotidien',
  trendColor,
  variant = 'default',
}: ModuleChartsProps) {
  const color = trendColor || VARIANT_COLORS[variant] || VARIANT_COLORS.default;
  const gradientId = `gradient-${variant}`;

  const hasTrend = data.trend && data.trend.some((d) => d.value > 0);
  const hasDistrib = data.distribution && data.distribution.some((d) => d.value > 0);
  const hasDaily = data.daily && data.daily.some((d) => d.value > 0);

  const totalTrend = useMemo(() => data.trend?.reduce((s, d) => s + d.value, 0) || 0, [data.trend]);

  if (!hasTrend && !hasDistrib && !hasDaily) return null;

  return (
    <div className="space-y-5">
      {title && (
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trend Area Chart */}
        {hasTrend && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 lg:col-span-2 hover:border-brand/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {trendLabel}
                </h4>
              </div>
              {totalTrend > 0 && (
                <span className="text-xs font-medium text-gray-400">
                  Total:{' '}
                  <strong className="text-gray-900 dark:text-gray-100">
                    {totalTrend.toLocaleString()} {trendUnit}
                  </strong>
                </span>
              )}
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    className="dark:opacity-20"
                  />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    fill={`url(#${gradientId})`}
                    strokeWidth={2}
                    name={trendLabel}
                  />
                  {data.trend?.[0]?.secondary !== undefined && (
                    <Area
                      type="monotone"
                      dataKey="secondary"
                      stroke={PIE_COLORS[2]}
                      fill="none"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      name="Comparaison"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Distribution Pie Chart */}
        {hasDistrib && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:border-brand/20 transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="h-4 w-4 text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {distributionLabel}
              </h4>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    label={PieLabel}
                    labelLine={false}
                  >
                    {(data.distribution || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
                      />
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
          </div>
        )}
      </div>

      {/* Daily Bar Chart */}
      {hasDaily && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:border-brand/20 transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {dailyLabel}
            </h4>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} name={dailyLabel} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
