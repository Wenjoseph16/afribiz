'use client';

import { useQuery } from '@tanstack/react-query';
import { Sparkles, ThumbsUp, Eye, ShoppingBag, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';
import Image from 'next/image';

export default function RecommendationsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const res = await apiClient.getRecommendations();
      return res.data.data;
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const recs = Array.isArray(data) ? data : (data?.recommendations ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Recommandations"
        description="Suggestions personnalisées pour votre activité"
        breadcrumbs={[{ label: 'Recommandations' }]}
      />

      <Card title="Suggestions pour vous" titleIcon={<Sparkles className="h-4 w-4" />}>
        {recs.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-10 w-10" />}
            title="Aucune recommandation"
            description="Des recommandations personnalisées apparaîtront avec votre activité"
          />
        ) : (
          <div className="space-y-2">
            {recs.map((r: any) => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                {r.image && (
                  <Image
                    src={r.image}
                    alt={r.name || ''}
                    width={48}
                    height={48}
                    className="rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.name || r.title}</p>
                  <p className="text-xs text-gray-500">{r.description || r.category}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    {r.rating && <span className="flex items-center gap-0.5">★ {r.rating}</span>}
                    {r.price && <span>{r.price} CFA</span>}
                  </div>
                </div>
                <Badge
                  variant={
                    r.relevance === 'high'
                      ? 'success'
                      : r.relevance === 'medium'
                        ? 'warning'
                        : 'default'
                  }
                >
                  {r.relevance ?? 'medium'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
