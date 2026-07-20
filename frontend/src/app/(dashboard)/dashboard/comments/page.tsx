'use client';

import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Trash2, Flag, Filter, MessageCircle } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';
import { useState } from 'react';

export default function CommentsPage() {
  const [filter, setFilter] = useState('all');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['comments', filter],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/business/me');
        const business = res.data?.data;
        if (!business?.id) return { comments: [] };
        const commentsRes = await apiClient.getComments('BUSINESS', business.id);
        return commentsRes.data.data;
      } catch {
        return { comments: [] };
      }
    },
    retry: false,
  });

  if (error)
    return (
      <ErrorState message={(error as any)?.message || 'Erreur de chargement'} onRetry={refetch} />
    );
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const comments = Array.isArray(data) ? data : (data?.comments ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Commentaires"
        description="Modérez les commentaires sur vos publications"
        breadcrumbs={[{ label: 'Commentaires' }]}
      />

      <Card title="Tous les commentaires" titleIcon={<MessageSquare className="h-4 w-4" />}>
        {comments.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="h-10 w-10" />}
            title="Aucun commentaire"
            description="Les commentaires de vos clients apparaîtront ici"
          />
        ) : (
          <div className="space-y-3">
            {comments.map((c: any) => (
              <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{c.userName || 'Anonyme'}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                    <Badge
                      variant={
                        c.status === 'approved'
                          ? 'success'
                          : c.status === 'pending'
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{c.content}</p>
                </div>
                <div className="flex items-start gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-gray-400 hover:text-yellow-500 transition-colors">
                    <Flag className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
