'use client';

import { useQuery } from '@tanstack/react-query';
import { Lightbulb, Target, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

export default function GrowthCoachingPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['growth-coaching'],
    queryFn: async () => {
      const res = await apiClient.getGrowthCoaching();
      return res.data.data;
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const sessions = Array.isArray(data) ? data : (data?.sessions ?? []);
  const stats = data?.stats ?? {};

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Coaching croissance"
        description="Recommandations et sessions pour booster votre activité"
        breadcrumbs={[{ label: 'Coaching' }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatsCard
          icon={<Lightbulb className="h-5 w-5" />}
          label="Recommandations"
          value={stats.recommendations ?? 0}
        />
        <StatsCard
          icon={<Target className="h-5 w-5" />}
          label="Objectifs atteints"
          value={stats.completedGoals ?? 0}
        />
        <StatsCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="Taux complétion"
          value={stats.completionRate ?? '0%'}
        />
      </div>

      <Card title="Sessions de coaching" titleIcon={<Lightbulb className="h-4 w-4" />}>
        {sessions.length === 0 ? (
          <EmptyState
            icon={<Target className="h-10 w-10" />}
            title="Aucune session"
            description="Des sessions de coaching seront suggérées selon votre activité"
          />
        ) : (
          <div className="space-y-2">
            {sessions.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${s.completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}
                  >
                    {s.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-gray-500">{s.description}</p>
                  </div>
                </div>
                <Badge variant={s.completed ? 'success' : s.inProgress ? 'warning' : 'default'}>
                  {s.completed ? 'Fait' : s.inProgress ? 'En cours' : 'Planifié'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
