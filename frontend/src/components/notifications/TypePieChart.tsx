'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PIE_COLORS_RING = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ef4444',
  '#f97316',
  '#84cc16',
  '#6b7280',
];

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

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
        {payload[0]?.name || label}
      </p>
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

interface TypeDataPoint {
  type: string;
  count: number;
  name: string;
}

export function TypePieChart({ data, compact }: { data: TypeDataPoint[]; compact?: boolean }) {
  if (!data.length) {
    return (
      <div className="h-72 flex items-center justify-center">
        <p className="text-sm text-gray-400">Aucune donnée</p>
      </div>
    );
  }

  return (
    <div className={compact ? 'h-56' : 'h-72'}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={compact ? 35 : 45}
            outerRadius={compact ? 70 : 80}
            paddingAngle={3}
            dataKey="count"
            label={PieLabel}
            labelLine={false}
          >
            {data.map((_: any, index: number) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS_RING[index % PIE_COLORS_RING.length]} />
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
  );
}
