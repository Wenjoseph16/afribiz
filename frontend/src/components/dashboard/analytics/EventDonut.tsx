'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

export interface DonutDatum {
  name: string;
  value: number;
  /** Couleur explicite (facultatif — sinon palette auto) */
  color?: string;
}

const PALETTE = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
  '#64748b', // slate
];

interface EventDonutProps {
  title: string;
  data: DonutDatum[];
  /** Couleur du segment actif (filtre appliqué) */
  activeSegment?: string | null;
  /** Cliqué sur un segment → applique le filtre (null = tout) */
  onSegmentClick?: (name: string | null) => void;
  emptyLabel?: string;
  className?: string;
}

export function EventDonut({
  title,
  data,
  activeSegment,
  onSegmentClick,
  emptyLabel = 'Aucun événement sur la période',
  className,
}: EventDonutProps) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const chartData = data
    .filter((d) => d.value > 0)
    .map((d, i) => ({ ...d, color: d.color || PALETTE[i % PALETTE.length] }));

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900/60 p-5',
        className
      )}
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        {total} événements au total
      </p>

      {chartData.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative h-44 w-44 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                  onClick={(entry: any) => {
                    if (onSegmentClick) {
                      onSegmentClick(activeSegment === entry.name ? null : entry.name);
                    }
                  }}
                  className="cursor-pointer outline-none"
                >
                  {chartData.map((d) => (
                    <Cell
                      key={d.name}
                      fill={d.color}
                      opacity={activeSegment && activeSegment !== d.name ? 0.35 : 1}
                      className="transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} événements`, name]}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgb(229 231 235)',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Total au centre */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{total}</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">événements</span>
            </div>
          </div>

          {/* Légende (cliquable si onSegmentClick) */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 flex-1 min-w-0">
            {chartData.map((d) => {
              const isActiveFilter = activeSegment && activeSegment !== d.name;
              const content = (
                <>
                  <span
                    className="h-2.5 w-2.5 rounded-full inline-block"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-gray-700 dark:text-gray-300 capitalize">{d.name}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{d.value}</span>
                </>
              );
              const cls = cn(
                'flex items-center gap-1.5 text-xs transition-opacity',
                onSegmentClick && 'hover:opacity-70 cursor-pointer',
                isActiveFilter && 'opacity-40'
              );
              return onSegmentClick ? (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => onSegmentClick(activeSegment === d.name ? null : d.name)}
                  className={cls}
                >
                  {content}
                </button>
              ) : (
                <span key={d.name} className={cls}>
                  {content}
                </span>
              );
            })}
            {onSegmentClick && activeSegment && (
              <button
                type="button"
                onClick={() => onSegmentClick(null)}
                className="text-xs text-brand font-medium hover:underline ml-auto"
              >
                ✕ Effacer le filtre
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
