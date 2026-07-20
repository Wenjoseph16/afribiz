'use client';

import { useQuery } from '@tanstack/react-query';
import { Brain, Users, Activity, Target, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

export default function ClientIntelligencePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['client-intelligence'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/client-intelligence/my');
        return (
          res.data.data || {
            avgScore: '-',
            activityRate: '0%',
            accuracy: '0%',
            trend: 'stable',
            insights: [],
          }
        );
      } catch {
        return { avgScore: '-', activityRate: '0%', accuracy: '0%', trend: 'stable', insights: [] };
      }
    },
    retry: false,
  });

  if (error) {
    console.warn('Erreur intelligence client:', error);
    // On continue avec des données par défaut
  }
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const insights = Array.isArray(data) ? data : (data?.insights ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Intelligence client"
        description="Analyses et insights sur le comportement de vos clients"
        breadcrumbs={[{ label: 'Intelligence client' }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard
          icon={<Brain className="h-5 w-5" />}
          label="Score moyen"
          value={data?.avgScore ?? '-'}
        />
        <StatsCard
          icon={<Activity className="h-5 w-5" />}
          label="Taux d'activité"
          value={data?.activityRate ?? '0%'}
        />
        <StatsCard
          icon={<Target className="h-5 w-5" />}
          label="Précision"
          value={data?.accuracy ?? '0%'}
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Tendance"
          value={data?.trend ?? 'stable'}
        />
      </div>

      <Card title="Insights" titleIcon={<Brain className="h-4 w-4" />}>
        {insights.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Aucun insight disponible pour le moment
          </p>
        ) : (
          <div className="space-y-3">
            {insights.map((item: any) => (
              <div key={item.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{item.title}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      item.sentiment === 'positive'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : item.sentiment === 'negative'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {item.sentiment}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
