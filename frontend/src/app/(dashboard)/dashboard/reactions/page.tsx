'use client';

import { useQuery } from '@tanstack/react-query';
import { Smile, Heart, ThumbsUp, Laugh, Angry, Frown, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

export default function ReactionsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reactions'],
    queryFn: async () => {
      const res = await apiClient.getReactions('business', 'all');
      return res.data.data;
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const reactions = Array.isArray(data) ? data : (data?.reactions ?? []);
  const stats = data?.stats ?? {};

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Réactions"
        description="Analysez les réactions à vos contenus"
        breadcrumbs={[{ label: 'Réactions' }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard icon={<Heart className="h-5 w-5" />} label="J'aime" value={stats.likes ?? 0} />
        <StatsCard
          icon={<ThumbsUp className="h-5 w-5" />}
          label="Utile"
          value={stats.useful ?? 0}
        />
        <StatsCard icon={<Laugh className="h-5 w-5" />} label="Drôle" value={stats.funny ?? 0} />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total"
          value={stats.total ?? 0}
        />
      </div>

      <Card title="Réactions récentes" titleIcon={<Smile className="h-4 w-4" />}>
        {reactions.length === 0 ? (
          <EmptyState
            icon={<Smile className="h-10 w-10" />}
            title="Aucune réaction"
            description="Les réactions de vos clients apparaîtront ici"
          />
        ) : (
          <div className="space-y-2">
            {reactions.map((r: any) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{r.emoji || '👍'}</span>
                  <div>
                    <p className="text-sm font-medium">{r.userName || 'Anonyme'}</p>
                    <p className="text-xs text-gray-500">
                      {r.targetType} · {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{r.type}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
