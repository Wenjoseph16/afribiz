'use client';

import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Award, RefreshCw, ShoppingBag,
  UserCheck, Activity, Zap, Star, Shield,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useBusinessStore } from '@/stores/businessStore';
import {
  useMyScore, useScoreHistory, useMyBadges, useRecomputeScore,
} from '@/features/afriScoreHooks';

const SCORE_MAX = 1000;

function getScoreLevel(score: number) {
  if (score >= 900) return { label: 'Excellent', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30', ring: 'ring-emerald-500' };
  if (score >= 700) return { label: 'Très bon', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30', ring: 'ring-blue-500' };
  if (score >= 500) return { label: 'Bon', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30', ring: 'ring-amber-500' };
  if (score >= 300) return { label: 'Moyen', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/30', ring: 'ring-orange-500' };
  return { label: 'Faible', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/30', ring: 'ring-red-500' };
}

const COMPONENT_META: Record<string, { label: string; icon: any; desc: string }> = {
  commercialActivity: { label: 'Activité commerciale', icon: ShoppingBag, desc: 'Volume de transactions et commandes' },
  financialBehavior: { label: 'Comportement financier', icon: Shield, desc: 'Régularité des paiements et solvabilité' },
  satisfaction: { label: 'Satisfaction client', icon: Star, desc: 'Avis, notes et recommandations' },
  operationalReliability: { label: 'Fiabilité opérationnelle', icon: Activity, desc: 'Taux de complétion et respect des délais' },
  profileCompleteness: { label: 'Complétude du profil', icon: UserCheck, desc: 'Informations renseignées et documents' },
};

export default function AfriScorePage() {
  const { business } = useBusinessStore();
  const { data: scoreData, isLoading: scoreLoading, error: scoreError } = useMyScore();
  const { data: historyData } = useScoreHistory(30);
  const { data: badgesData } = useMyBadges();
  const recomputeMutation = useRecomputeScore();
  const [recomputing, setRecomputing] = useState(false);

  const score = scoreData?.score ?? 0;
  const components = scoreData?.components ?? {};
  const level = getScoreLevel(score);
  const history = Array.isArray(historyData) ? historyData : historyData?.history ?? [];
  const badges = Array.isArray(badgesData) ? badgesData : badgesData?.badges ?? [];

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      await recomputeMutation.mutateAsync();
    } finally {
      setRecomputing(false);
    }
  };

  if (scoreLoading) {
    return <Loader className="min-h-[60vh]" />;
  }

  if (scoreError && !score) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              AfriScore
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {business ? 'Votre score de confiance et de performance' : 'Le score de confiance des businesses'}
            </p>
          </div>
        </div>
        {!business ? (
          <EmptyState
            icon={<Award className="h-8 w-8" />}
            title="Aucun business"
            description="Créez ou activez votre business pour voir votre AfriScore."
          />
        ) : (
          <EmptyState
            icon={<RefreshCw className="h-8 w-8" />}
            title="Score non disponible"
            description="Cliquez ci-dessous pour calculer votre premier score."
            action={
              <Button variant="gradient" onClick={handleRecompute} isLoading={recomputing}>
                <Zap className="h-4 w-4" />
                Calculer mon AfriScore
              </Button>
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            AfriScore
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {business?.name || 'Votre score de confiance et de performance'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRecompute}
            isLoading={recomputing}
          >
            <RefreshCw className="h-4 w-4" />
            Recalculer
          </Button>
        </div>
      </div>

      {/* Score Hero */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-amber-500/5" />
        <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Score Ring */}
          <div className="flex flex-col items-center shrink-0">
            <div className={`relative w-36 h-36 rounded-full ${level.bg} ${level.ring} ring-4 flex items-center justify-center`}>
              <div className="text-center">
                <p className={`text-4xl font-black ${level.color}`}>{score}</p>
                <p className={`text-xs font-semibold ${level.color} mt-0.5`}>/ {SCORE_MAX}</p>
              </div>
            </div>
            <div className={`mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full ${level.bg}`}>
              {score >= 500 ? <TrendingUp className={`h-3.5 w-3.5 ${level.color}`} /> : <TrendingDown className={`h-3.5 w-3.5 ${level.color}`} />}
              <span className={`text-xs font-bold ${level.color}`}>{level.label}</span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Badges obtenus
            </p>
            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {badges.map((badge: any) => (
                  <span
                    key={badge.id || badge.type}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200/50 dark:border-amber-700/30 text-xs font-semibold text-amber-800 dark:text-amber-300"
                  >
                    <Star className="h-3 w-3" />
                    {badge.label || badge.type}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Pas encore de badge</p>
            )}
          </div>
        </div>
      </Card>

      {/* Components Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Object.entries(COMPONENT_META).map(([key, meta]) => {
          const val = components[key] ?? 0;
          const compLevel = getScoreLevel(val * 5);
          const Icon = meta.icon;
          return (
            <StatsCard
              key={key}
              icon={<Icon className="h-5 w-5" />}
              iconBg={compLevel.bg}
              iconColor={compLevel.color.replace('text-', 'text-')}
              label={meta.label}
              value={`${Math.round(val)} / 200`}
              trend={val >= 100 ? { value: 'Bon', positive: true } : val >= 50 ? { value: 'Moyen', positive: true } : { value: 'À améliorer', positive: false }}
            />
          );
        })}
      </div>

      {/* Score History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Évolution du score (30 jours)
          </h3>
        </div>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.slice(0, 10).map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Score: {entry.totalScore ?? entry.score}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {Object.entries(COMPONENT_META).slice(0, 3).map(([ck]) => {
                    const cv = entry.components?.[ck] ?? 0;
                    return (
                      <div key={ck} className="w-1.5 h-6 rounded-full" style={{
                        backgroundColor: cv >= 100 ? '#10b981' : cv >= 50 ? '#f59e0b' : '#ef4444',
                        opacity: 0.7,
                      }} />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Pas encore d&apos;historique</p>
          </div>
        )}
      </Card>
    </div>
  );
}
