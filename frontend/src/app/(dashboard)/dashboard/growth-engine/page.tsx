'use client';

import { useQuery } from '@tanstack/react-query';
import { Rocket, TrendingUp, BarChart3, Lightbulb, Zap, Target } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

export default function GrowthEnginePage() {
  const {
    data: metrics,
    isLoading: mLoading,
    error: mError,
    refetch,
  } = useQuery({
    queryKey: ['growth-metrics'],
    queryFn: async () => {
      const res = await apiClient.getGrowthMetrics();
      return res.data.data;
    },
  });

  const { data: recommendations } = useQuery({
    queryKey: ['growth-recommendations'],
    queryFn: async () => {
      const res = await apiClient.getGrowthRecommendations();
      return res.data.data;
    },
  });

  if (mError) return <ErrorState message={(mError as any).message} onRetry={refetch} />;
  if (mLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const recs = Array.isArray(recommendations) ? recommendations : (recommendations?.items ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Moteur de croissance"
        description="Analytics et recommandations pour accélérer votre croissance"
        breadcrumbs={[{ label: 'Croissance' }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Croissance"
          value={metrics?.growthRate ?? '0%'}
        />
        <StatsCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Revenus"
          value={metrics?.revenue ?? '0 CFA'}
        />
        <StatsCard
          icon={<Target className="h-5 w-5" />}
          label="Objectifs"
          value={`${metrics?.completedGoals ?? 0}/${metrics?.totalGoals ?? 0}`}
        />
        <StatsCard icon={<Zap className="h-5 w-5" />} label="Score" value={metrics?.score ?? 0} />
      </div>

      <Card title="Recommandations" titleIcon={<Lightbulb className="h-4 w-4" />}>
        {recs.length === 0 ? (
          <EmptyState
            icon={<Rocket className="h-10 w-10" />}
            title="Aucune recommandation"
            description="Des recommandations personnalisées apparaîtront ici"
          />
        ) : (
          <div className="space-y-2">
            {recs.map((r: any) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${r.impact === 'high' ? 'bg-green-100 dark:bg-green-900/30' : r.impact === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}
                  >
                    <Lightbulb
                      className={`h-4 w-4 ${r.impact === 'high' ? 'text-green-600' : r.impact === 'medium' ? 'text-yellow-600' : 'text-blue-600'}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-gray-500">{r.description}</p>
                  </div>
                </div>
                <Badge
                  variant={
                    r.impact === 'high' ? 'success' : r.impact === 'medium' ? 'warning' : 'default'
                  }
                >
                  {r.impact}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
