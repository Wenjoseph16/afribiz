'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, MapPin, Clock, Building2, Briefcase } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

export default function OpportunitiesPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const res = await apiClient.getOpportunities();
      return res.data.data;
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const opportunities = Array.isArray(data) ? data : (data?.opportunities ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Opportunités"
        description="Découvrez des opportunités d'affaires"
        breadcrumbs={[{ label: 'Opportunités' }]}
      />

      <Card title="Opportunités récentes" titleIcon={<Briefcase className="h-4 w-4" />}>
        {opportunities.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="h-10 w-10" />}
            title="Aucune opportunité"
            description="Les opportunités correspondant à votre profil apparaîtront ici"
          />
        ) : (
          <div className="space-y-2">
            {opportunities.map((o: any) => (
              <div
                key={o.id}
                className="flex items-start justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{o.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{o.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {o.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {o.location}
                        </span>
                      )}
                      {o.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(o.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {o.budget && <span className="text-sm font-semibold">{o.budget} CFA</span>}
                  <Badge
                    variant={
                      o.type === 'partnership'
                        ? 'success'
                        : o.type === 'contract'
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {o.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
