'use client';

import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Calendar,
  BarChart3,
  Sparkles,
  Lightbulb,
  Shield,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Benchmark {
  metric: string;
  label: string;
  businessValue: number;
  peerAvg: number;
  difference: number;
  direction: 'above' | 'below' | 'equal';
  unit: string;
}

interface Anomaly {
  metric: string;
  label: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  direction: 'up' | 'down';
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

interface SeasonalOpportunity {
  event: string;
  eventDate: string;
  daysUntil: number;
  type: string;
  suggestion: string;
  action?: string;
}

export function CopilotInsights() {
  const { data: benchmarks } = useQuery({
    queryKey: ['copilot-benchmarks'],
    queryFn: async () => {
      const res = await apiClient.getBenchmarks();
      return res.data.data as { benchmarks: Benchmark[]; peerCount: number };
    },
    refetchInterval: 300000,
  });

  const { data: anomalies } = useQuery({
    queryKey: ['copilot-anomalies'],
    queryFn: async () => {
      const res = await apiClient.getAnomalies();
      return res.data.data as { anomalies: Anomaly[] };
    },
    refetchInterval: 300000,
  });

  const { data: seasonal } = useQuery({
    queryKey: ['copilot-seasonal'],
    queryFn: async () => {
      const res = await apiClient.getSeasonal();
      return res.data.data as { opportunities: SeasonalOpportunity[] };
    },
    refetchInterval: 600000,
  });

  const hasData =
    (benchmarks?.benchmarks?.length || 0) > 0 ||
    (anomalies?.anomalies?.length || 0) > 0 ||
    (seasonal?.opportunities?.length || 0) > 0;

  if (!hasData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Benchmarks */}
      {benchmarks?.benchmarks && benchmarks.benchmarks.length > 0 && (
        <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Benchmark
            </h4>
            <span className="text-[10px] text-gray-400 ml-auto">
              vs {benchmarks.peerCount} pairs
            </span>
          </div>
          <div className="space-y-2">
            {benchmarks.benchmarks.slice(0, 4).map((b) => (
              <div key={b.metric} className="flex items-center gap-2 text-sm">
                {b.direction === 'above' ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : b.direction === 'below' ? (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
                ) : (
                  <BarChart3 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                )}
                <span className="text-gray-600 dark:text-gray-400 text-xs flex-1">{b.label}</span>
                <span
                  className={cn(
                    'text-xs font-medium',
                    b.direction === 'above' && 'text-emerald-600',
                    b.direction === 'below' && 'text-red-600',
                    b.direction === 'equal' && 'text-gray-500'
                  )}
                >
                  {b.businessValue} vs {b.peerAvg}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies */}
      {anomalies?.anomalies && anomalies.anomalies.length > 0 && (
        <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Signaux (7j)
            </h4>
          </div>
          <div className="space-y-2">
            {anomalies.anomalies.slice(0, 3).map((a, i) => (
              <div
                key={i}
                className={cn(
                  'text-xs p-2 rounded-lg border',
                  a.severity === 'critical' &&
                    'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-300',
                  a.severity === 'warning' &&
                    'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 text-amber-700 dark:text-amber-300',
                  a.severity === 'info' &&
                    'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                )}
              >
                {a.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seasonal Opportunities */}
      {seasonal?.opportunities && seasonal.opportunities.length > 0 && (
        <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-purple-600" />
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Opportunités
            </h4>
          </div>
          <div className="space-y-2">
            {seasonal.opportunities.map((o, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800"
              >
                <Sparkles className="h-3 w-3 text-purple-600 mt-0.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-purple-700 dark:text-purple-300">
                      {o.event}
                    </span>
                    {o.daysUntil <= 3 && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded-full">
                        URGENT
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-0.5">{o.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
