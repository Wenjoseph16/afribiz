'use client';

import { useQuery } from '@tanstack/react-query';
import { Lightbulb, Plus, ThumbsUp, MessageSquare, Eye } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

export default function MarketIdeasPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['market-ideas'],
    queryFn: async () => {
      const res = await apiClient.getMarketIdeas();
      return res.data.data;
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const ideas = Array.isArray(data) ? data : (data?.ideas ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Idées marché"
        description="Proposez et explorez des idées pour le marché"
        breadcrumbs={[{ label: 'Idées marché' }]}
        actions={
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Proposer une idée
          </Button>
        }
      />

      <Card title="Idées récentes" titleIcon={<Lightbulb className="h-4 w-4" />}>
        {ideas.length === 0 ? (
          <EmptyState
            icon={<Lightbulb className="h-10 w-10" />}
            title="Aucune idée"
            description="Soyez le premier à proposer une idée"
          />
        ) : (
          <div className="space-y-2">
            {ideas.map((idea: any) => (
              <div key={idea.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{idea.title}</p>
                    <p className="text-xs text-gray-500">{idea.description}</p>
                  </div>
                  <Badge
                    variant={
                      idea.status === 'approved'
                        ? 'success'
                        : idea.status === 'pending'
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {idea.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    {idea.likes ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {idea.comments ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {idea.views ?? 0}
                  </span>
                  <span className="ml-auto">Par {idea.authorName || 'Anonyme'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
