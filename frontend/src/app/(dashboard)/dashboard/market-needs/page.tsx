'use client';

import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Plus, TrendingUp, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

export default function MarketNeedsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['market-needs'],
    queryFn: async () => {
      const res = await apiClient.getMarketNeeds();
      return res.data.data;
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const needs = Array.isArray(data) ? data : (data?.needs ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Besoins du marché"
        description="Identifiez les besoins non satisfaits sur le marché"
        breadcrumbs={[{ label: 'Besoins marché' }]}
        actions={
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Signaler un besoin
          </Button>
        }
      />

      <Card title="Besoins identifiés" titleIcon={<ClipboardList className="h-4 w-4" />}>
        {needs.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-10 w-10" />}
            title="Aucun besoin"
            description="Soyez le premier à signaler un besoin du marché"
          />
        ) : (
          <div className="space-y-2">
            {needs.map((n: any) => (
              <div
                key={n.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${n.fulfilled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}
                  >
                    {n.fulfilled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-gray-500">{n.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {n.upvotes ?? 0} votes · {n.location || n.region}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={n.fulfilled ? 'success' : n.priority === 'high' ? 'danger' : 'warning'}
                >
                  {n.fulfilled ? 'Pourvu' : n.priority}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
