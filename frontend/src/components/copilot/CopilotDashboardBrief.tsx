'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Bot,
  Sparkles,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  X,
  ChevronDown,
  BarChart3,
  Shield,
  BrainCircuit,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';

interface DailyTip {
  type: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  action?: string;
  moduleKey?: string;
}

interface HealthData {
  healthScore: number;
  status: 'excellent' | 'good' | 'fair' | 'critical';
  metrics: {
    afriScore: number;
    orders30d: number;
    reviews30d: number;
    pageViews30d: number;
    totalProducts: number;
  };
}

const HEALTH_CONFIG = {
  excellent: {
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
    label: 'Excellent',
  },
  good: {
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: TrendingUp,
    label: 'Bon',
  },
  fair: {
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: BarChart3,
    label: 'Moyen',
  },
  critical: {
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: AlertTriangle,
    label: 'Critique',
  },
};

const PRIORITY_STYLES = {
  high: {
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    label: 'Prioritaire',
  },
  medium: {
    icon: Lightbulb,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    label: 'Recommandé',
  },
  low: {
    icon: Sparkles,
    color:
      'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    label: 'Conseil',
  },
};

export function CopilotDashboardBrief() {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [llmBrief, setLlmBrief] = useState<string | null>(null);

  const { data: tipsData, isLoading: tipsLoading } = useQuery({
    queryKey: ['copilot-daily-tips'],
    queryFn: async () => {
      const res = await apiClient.getDailyTips();
      return res.data.data as { tips: DailyTip[]; businessName?: string; score?: any };
    },
    refetchInterval: 300000,
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['copilot-business-health'],
    queryFn: async () => {
      const res = await apiClient.getBusinessHealth();
      return res.data.data as HealthData;
    },
    refetchInterval: 300000,
  });

  const llmMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.generateLLMAnalysis();
      return res.data.data as {
        summary: string;
        insights: string[];
        suggestions: string[];
        riskLevel?: string;
        healthScore?: number;
        healthStatus?: string;
      } | null;
    },
    onSuccess: (data) => {
      if (data?.summary) {
        const parts = [data.summary];
        if (data.insights && data.insights.length > 0) {
          parts.push(
            '',
            "Points d'attention :",
            ...data.insights.slice(0, 3).map((i: string) => `  • ${i}`)
          );
        }
        if (data.suggestions && data.suggestions.length > 0) {
          parts.push(
            '',
            'Suggestions :',
            ...data.suggestions.slice(0, 3).map((s: string) => `  • ${s}`)
          );
        }
        if (data.riskLevel === 'high') {
          parts.push('', '⚠️ Risque élevé détecté — consultez votre tableau de bord.');
        }
        setLlmBrief(parts.join('\n'));
      }
    },
  });

  if (dismissed || (tipsLoading && healthLoading)) return null;

  const tips = tipsData?.tips || [];
  const health = healthData;
  const healthConfig = health ? HEALTH_CONFIG[health.status] || HEALTH_CONFIG.fair : null;
  const HealthIcon = healthConfig?.icon || BarChart3;

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-indigo-950/30 dark:via-gray-900 dark:to-emerald-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-brand shadow-sm">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Copilot — Assistant IA
              </h3>
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {tipsData?.businessName
                ? `Conseils personnalisés pour ${tipsData.businessName}`
                : 'Conseils et analyse pour votre business'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tips.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
              />
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Health Score + Summary */}
      <div className="px-4 sm:px-5 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Health Score */}
          {health && healthConfig && (
            <div
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border',
                healthConfig.bg,
                healthConfig.border
              )}
            >
              <div className={cn('p-2 rounded-lg', healthConfig.bg)}>
                <HealthIcon className={cn('h-5 w-5', healthConfig.color)} />
              </div>
              <div>
                <p className={cn('text-lg font-bold', healthConfig.color)}>
                  {health.healthScore}/100
                </p>
                <p className={cn('text-xs font-medium', healthConfig.color)}>
                  Santé: {healthConfig.label}
                </p>
              </div>
            </div>
          )}

          {/* Quick metrics */}
          {health && (
            <>
              <MetricBadge
                label="Commandes (30j)"
                value={health.metrics.orders30d.toString()}
                icon={TrendingUp}
                color="text-purple-600"
                bg="bg-purple-50 dark:bg-purple-900/20"
              />
              <MetricBadge
                label="Avis (30j)"
                value={health.metrics.reviews30d.toString()}
                icon={Shield}
                color="text-amber-600"
                bg="bg-amber-50 dark:bg-amber-900/20"
              />
              <MetricBadge
                label="AfriScore"
                value={health.metrics.afriScore.toString()}
                icon={BarChart3}
                color="text-indigo-600"
                bg="bg-indigo-50 dark:bg-indigo-900/20"
              />
            </>
          )}
        </div>
      </div>

      {/* LLM Analysis Card */}
      <div className="px-4 sm:px-5 pb-4">
        <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-white/50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Analyse IA
              </span>
            </div>
            <button
              onClick={() => llmMutation.mutate()}
              disabled={llmMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-brand rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {llmMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {llmMutation.isPending ? 'Analyse...' : 'Générer analyse IA'}
            </button>
          </div>
          {llmBrief && (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{llmBrief}</p>
          )}
          {!llmBrief && !llmMutation.isPending && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Cliquez sur "Générer analyse IA" pour obtenir une analyse de vos performances sur les
              30 derniers jours.
            </p>
          )}
        </div>
      </div>

      {/* Expanded tips */}
      {expanded && tips.length > 0 && (
        <div className="px-4 sm:px-5 pb-5 space-y-2 border-t border-indigo-100 dark:border-indigo-900/50 pt-4">
          {tips.slice(0, 6).map((tip, i) => {
            const pStyle = PRIORITY_STYLES[tip.priority] || PRIORITY_STYLES.low;
            const PIcon = pStyle.icon;
            const actionLink = tip.action
              ? tip.moduleKey
                ? `/dashboard/${tip.moduleKey.toLowerCase()}`
                : tip.action?.includes('promo') || tip.action?.includes('Promotion')
                  ? '/dashboard/promotions'
                  : tip.action?.includes('produit') || tip.action?.includes('Produit')
                    ? '/dashboard/products'
                    : '/dashboard/settings'
              : null;

            return (
              <div
                key={i}
                className={cn('flex items-start gap-3 p-3 rounded-xl border', pStyle.color)}
              >
                <div className="p-1.5 rounded-lg shrink-0">
                  <PIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                      {pStyle.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{tip.message}</p>
                </div>
                {actionLink && (
                  <Link
                    href={actionLink}
                    className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-700 shrink-0 mt-1"
                  >
                    {tip.action}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Collapsed preview */}
      {!expanded && tips.length > 0 && (
        <div className="px-4 sm:px-5 pb-4">
          <div className="flex flex-wrap gap-2">
            {tips.slice(0, 3).map((tip, i) => (
              <span
                key={i}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                  tip.priority === 'high'
                    ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : tip.priority === 'medium'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                )}
              >
                <Lightbulb className="h-3 w-3" />
                {tip.message.length > 60 ? tip.message.substring(0, 60) + '...' : tip.message}
              </span>
            ))}
            {tips.length > 3 && (
              <button
                onClick={() => setExpanded(true)}
                className="text-xs font-medium text-brand hover:text-brand-700"
              >
                +{tips.length - 3} autres conseils
              </button>
            )}
          </div>
        </div>
      )}

      {tips.length === 0 && !tipsLoading && (
        <div className="px-4 sm:px-5 pb-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Tout va bien ! Aucun conseil spécifique pour le moment.
          </p>
        </div>
      )}
    </div>
  );
}

function MetricBadge({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
  bg: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800',
        bg
      )}
    >
      <div className={cn('p-2 rounded-lg', bg)}>
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <div>
        <p className={cn('text-sm font-bold', color)}>{value}</p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}
