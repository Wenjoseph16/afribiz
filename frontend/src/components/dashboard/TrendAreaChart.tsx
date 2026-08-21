'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Metric
 * Ligne de métrique associée au graphique (ex: "Business actifs" → 73%).
 */
export interface ChartMetric {
  label: string;
  /** Pourcentage affiché (0-100). */
  value: number;
  /** Facultatif : libellé explicite à la place de "value %". */
  hint?: string;
}

export interface TrendAreaChartProps {
  /** Titre affiché à gauche de l'en-tête. */
  title: string;
  /** Sous-titre discret sous le titre (ex: "7 derniers jours"). */
  subtitle?: string;
  /** Point de données du graphique : libellé temporel + valeur. */
  data: Array<{ label: string; value: number }>;
  /** Libellé de la série (utilisé dans le tooltip). */
  dataKeyLabel?: string;
  /** Couleur de la courbe et du dégradé. Défaut : vert émeraude AfriBiz (#16A34A). */
  color?: string;
  /** Options du sélecteur de période (à droite de l'en-tête). */
  periodOptions?: Array<{ label: string; value: string }>;
  /** Index de la période sélectionnée par défaut. */
  defaultPeriod?: number;
  /** Métriques affichées sous le graphique avec barres de progression fines. */
  metrics?: ChartMetric[];
  /** Titre de la section métriques (ex: "Répartition"). */
  metricsTitle?: string;
  /** Formatteur de l'axe Y (ex: "1,2k"). */
  formatY?: (v: number) => string;
}

const DEFAULT_COLOR = '#16A34A';

/**
 * TrendAreaChart
 * Graphique en aires (Line/Area) moderne et épuré, intégré au design system AfriBiz.
 * - Carte blanche, coins arrondis (rounded-xl), ombre légère, padding p-6.
 * - Courbe lissée (monotone) émeraude + remplissage en dégradé vers le blanc.
 * - Grille horizontale fine et discrète, axes propres.
 * - Sélecteur de période + métriques associées avec barres de progression.
 */
export function TrendAreaChart({
  title,
  subtitle,
  data,
  dataKeyLabel = 'Valeur',
  color = DEFAULT_COLOR,
  periodOptions,
  defaultPeriod = 0,
  metrics,
  metricsTitle,
  formatY,
}: TrendAreaChartProps) {
  const [periodIndex, setPeriodIndex] = useState(defaultPeriod);
  const activePeriod = periodOptions?.[periodIndex];

  const chartData = useMemo(() => {
    if (!activePeriod) return data;
    return data.slice(-Number(activePeriod.value || data.length));
  }, [data, activePeriod]);

  // Dégradé : vert émeraude semi-transparent → blanc (transparent en dark mode).
  const areaId = useMemo(() => `grad-${title.replace(/\s+/g, '-').toLowerCase()}`, [title]);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800/90 p-6 shadow-sm border border-slate-200/70 dark:border-gray-700/80">
      {/* En-tête : titre à gauche, sélecteur de période à droite */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            {total.toLocaleString('fr-FR')}
          </div>
          {periodOptions && periodOptions.length > 0 && (
            <div className="relative">
              <select
                value={periodIndex}
                onChange={(e) => setPeriodIndex(Number(e.target.value))}
                className={cn(
                  'appearance-none bg-transparent text-xs font-medium text-gray-600 dark:text-gray-400',
                  'cursor-pointer pr-5 py-1 focus:outline-none'
                )}
                aria-label="Période"
              >
                {periodOptions.map((opt, i) => (
                  <option key={opt.value} value={i}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Graphique */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {/* Grille horizontale fine et discrète */}
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" opacity={0.45} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v: number) =>
                formatY ? formatY(v) : v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
              }
            />
            <Tooltip
              formatter={(value: any, name: any) => [
                Number(value).toLocaleString('fr-FR'),
                dataKeyLabel,
              ]}
              labelStyle={{ color: '#334155', fontSize: 12, fontWeight: 600 }}
              contentStyle={{
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                fontSize: 12,
                background: '#fff',
              }}
              cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            {/* Remplissage en dégradé sous la courbe */}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.25}
              fill={`url(#${areaId})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Métriques associées : barres de progression fines */}
      {metrics && metrics.length > 0 && (
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-gray-700/60">
          {metricsTitle && (
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
              {metricsTitle}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-600 dark:text-gray-300">{m.label}</span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 tabular-nums">
                    {m.hint ?? `${m.value}%`}
                  </span>
                </div>
                {/* Barre de progression fine */}
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-gray-700/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(m.value, 0), 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
