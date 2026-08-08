'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Star,
  StarHalf,
  MessageSquareHeart,
  TrendingUp,
  Users,
  ArrowRight,
  Sparkles,
  BadgeCheck,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface ReputationRecent {
  id: string;
  type: 'survey' | 'review';
  score: number;
  text: string | null;
  clientName: string;
  createdAt: string;
  responded: boolean;
}

interface BusinessReputation {
  businessId: string;
  businessName: string;
  overall: { average: number | null; total: number };
  sources: {
    surveys: { average: number | null; total: number };
    reviews: { average: number | null; total: number };
  };
  distribution: { score: number; count: number }[];
  trend: { date: string; count: number; average: number }[];
  recent: ReputationRecent[];
}

function Stars({ score, className }: { score: number; className?: string }) {
  const rounded = Math.round(score * 2) / 2;
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((i) =>
        rounded >= i ? (
          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ) : rounded >= i - 0.5 ? (
          <StarHalf key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ) : (
          <Star key={i} className="h-4 w-4 text-gray-300 dark:text-gray-600" />
        )
      )}
    </div>
  );
}

function scoreLabel(avg: number | null): { label: string; tone: string } {
  if (avg === null) return { label: '—', tone: 'text-gray-400' };
  if (avg >= 4.5) return { label: 'Excellent', tone: 'text-emerald-600' };
  if (avg >= 4) return { label: 'Très bien', tone: 'text-emerald-500' };
  if (avg >= 3.5) return { label: 'Bien', tone: 'text-amber-500' };
  if (avg >= 2.5) return { label: 'Moyen', tone: 'text-orange-500' };
  return { label: 'À améliorer', tone: 'text-red-500' };
}

export default function BusinessReputationCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['business', 'reputation'],
    queryFn: async () => {
      const res = await apiClient.getBusinessReputation();
      return res.data.data as BusinessReputation;
    },
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return <div className="h-64 rounded-2xl bg-gray-50 dark:bg-gray-800/50 animate-pulse" />;
  }

  if (!data) return null;

  const avg = data.overall.average;
  const maxTrend = Math.max(1, ...data.trend.map((t) => t.count));
  const label = scoreLabel(avg);
  const recent = data.recent.slice(0, 5);
  const { surveys, reviews } = data.sources;

  return (
    <Card
      padding="lg"
      className="overflow-hidden border-violet-200/60 dark:border-violet-900/40 bg-gradient-to-br from-violet-50/70 via-white to-fuchsia-50/60 dark:from-violet-950/20 dark:via-gray-900 dark:to-fuchsia-950/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-sm">
            <MessageSquareHeart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Réputation client
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Avis publics + enquêtes de satisfaction
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/crm"
          className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 shrink-0"
        >
          CRM
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {data.overall.total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-3">
            <Sparkles className="h-7 w-7 text-violet-500" />
          </div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Aucune note pour le moment
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
            Les enquêtes partent automatiquement après chaque livraison et séjour terminé. Les
            avis publics de vos clients apparaîtront ici.
          </p>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 dark:bg-violet-900/30 rounded-lg hover:bg-violet-100 transition-colors"
          >
            Voir mes commandes
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Score global + sources */}
          <div className="md:col-span-2 flex flex-col justify-center">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
                {avg !== null ? avg.toLocaleString('fr-FR') : '—'}
              </span>
              <span className="text-sm font-medium text-gray-400 mb-1.5">/ 5</span>
            </div>
            <Stars score={avg ?? 0} className="mt-2" />
            <p className={cn('mt-1.5 text-xs font-semibold', label.tone)}>{label.label}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Users className="h-3.5 w-3.5" />
              <span className="font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
                {data.overall.total}
              </span>
              feedback{data.overall.total > 1 ? 's' : ''}
            </div>

            {/* Deux sources */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-xl bg-white/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 dark:bg-violet-900/30 px-1.5 py-0.5 rounded-md shrink-0">
                    Enquêtes
                  </span>
                  <Stars score={surveys.average ?? 0} className="scale-90" />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums shrink-0">
                  {surveys.average !== null ? surveys.average.toLocaleString('fr-FR') : '—'}
                  <span className="text-gray-400 font-normal"> · {surveys.total}</span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-xl bg-white/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md shrink-0">
                    Avis publics
                  </span>
                  <Stars score={reviews.average ?? 0} className="scale-90" />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums shrink-0">
                  {reviews.average !== null ? reviews.average.toLocaleString('fr-FR') : '—'}
                  <span className="text-gray-400 font-normal"> · {reviews.total}</span>
                </span>
              </div>
            </div>

            {/* Distribution fusionnée */}
            <div className="mt-4 space-y-1.5">
              {data.distribution.map((d) => {
                const pct = Math.round((d.count / data.overall.total) * 100);
                return (
                  <div key={d.score} className="flex items-center gap-2">
                    <span className="w-6 text-[11px] font-medium text-gray-500 tabular-nums">
                      {d.score}★
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-200/80 dark:bg-gray-700/60 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={cn(
                          'h-full rounded-full',
                          d.score >= 4
                            ? 'bg-emerald-400'
                            : d.score === 3
                              ? 'bg-amber-400'
                              : 'bg-red-400'
                        )}
                      />
                    </div>
                    <span className="w-8 text-right text-[11px] text-gray-400 tabular-nums">
                      {d.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tendance + retours */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Tendance 30 jours (avis + enquêtes)
              </p>
            </div>
            {data.trend.every((t) => t.count === 0) ? (
              <div className="flex items-center justify-center h-32 rounded-xl bg-white/50 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-400">
                Pas de note ces 30 derniers jours
              </div>
            ) : (
              <div className="flex items-end gap-1 h-32 rounded-xl bg-white/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 p-3">
                {data.trend.map((t, i) => (
                  <div
                    key={t.date}
                    className="flex-1 h-full flex flex-col items-center justify-end group"
                    title={`${new Date(t.date + 'T00:00:00').toLocaleDateString('fr-FR')} — ${t.count} feedback${t.count > 1 ? 's' : ''}, ${t.average}/5`}
                  >
                    <div className="w-full flex-1 flex flex-col justify-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(8, (t.count / maxTrend) * 100)}%` }}
                        transition={{ duration: 0.5, delay: i * 0.03 }}
                        className={cn(
                          'w-full rounded-t-md transition-colors',
                          t.average >= 4
                            ? 'bg-gradient-to-t from-emerald-500 to-emerald-300'
                            : t.average >= 3
                              ? 'bg-gradient-to-t from-amber-500 to-amber-300'
                              : 'bg-gradient-to-t from-red-500 to-red-300'
                        )}
                      />
                    </div>
                    <span className="text-[9px] font-semibold text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                      {t.average}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Feed récent fusionné */}
            {recent.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Derniers retours
                </p>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {recent.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800"
                    >
                      <div className="shrink-0 pt-0.5">
                        <Stars score={r.score} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {r.clientName}
                            {r.responded && (
                              <BadgeCheck className="inline h-3 w-3 text-emerald-500 ml-1 -mt-0.5" />
                            )}
                          </p>
                          <span
                            className={cn(
                              'text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0',
                              r.type === 'survey'
                                ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600'
                                : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'
                            )}
                          >
                            {r.type === 'survey' ? 'Enquête' : 'Avis'}
                          </span>
                        </div>
                        {r.text ? (
                          <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
                            {r.text}
                          </p>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic mt-0.5">
                            Sans commentaire
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(r.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
