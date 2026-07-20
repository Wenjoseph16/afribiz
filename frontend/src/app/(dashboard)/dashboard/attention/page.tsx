'use client';

import { useQuery } from '@tanstack/react-query';
import { Eye, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

export default function AttentionPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['attention'],
    queryFn: async () => {
      try {
        const biz = await apiClient.getBusiness();
        const businessId = biz.data?.data?.id;
        if (!businessId) return { items: [], stats: {} };
        const res = await apiClient.getAttentionItems({ businessId });
        return res.data.data || { items: [], stats: {} };
      } catch {
        return { items: [], stats: {} };
      }
    },
    retry: false,
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const items = Array.isArray(data) ? data : (data?.items ?? []);
  const stats = data?.stats ?? {};

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Attention client"
        description="Suivez l'attention et l'engagement de vos clients"
        breadcrumbs={[{ label: 'Attention' }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard
          icon={<Eye className="h-5 w-5" />}
          label="Vues totales"
          value={stats.totalViews ?? 0}
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Taux d'attention"
          value={stats.attentionRate ?? '0%'}
        />
        <StatsCard
          icon={<TrendingDown className="h-5 w-5" />}
          label="Abandons"
          value={stats.abandonRate ?? '0%'}
        />
        <StatsCard
          icon={<Minus className="h-5 w-5" />}
          label="Temps moyen"
          value={stats.avgTime ?? '0s'}
        />
      </div>

      <Card title="Points d'attention" titleIcon={<Eye className="h-4 w-4" />}>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Aucune donnée d'attention disponible
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <span className="text-sm font-semibold">{item.score ?? item.value}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
