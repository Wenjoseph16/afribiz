'use client';

import { useQuery } from '@tanstack/react-query';
import { FileText, Plus, Trash2, Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';
import { useState } from 'react';

export default function PostsPage() {
  const [filter, setFilter] = useState('all');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['posts', filter],
    queryFn: async () => {
      const res = await apiClient.getPosts({ status: filter !== 'all' ? filter : undefined });
      return res.data.data;
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const posts = Array.isArray(data) ? data : (data?.posts ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Publications"
        description="Créez et gérez vos publications sociales"
        breadcrumbs={[{ label: 'Publications' }]}
        actions={
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nouvelle publication
          </Button>
        }
      />

      <Card title="Toutes les publications" titleIcon={<FileText className="h-4 w-4" />}>
        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'published', 'draft', 'archived'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filter === s
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {posts.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-10 w-10" />}
            title="Aucune publication"
            description="Créez votre première publication"
          />
        ) : (
          <div className="space-y-2">
            {posts.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{p.title || 'Sans titre'}</p>
                  <p className="text-xs text-gray-500 truncate max-w-md">{p.content}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {p.views ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {p.likes ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {p.comments ?? 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      p.status === 'published'
                        ? 'success'
                        : p.status === 'draft'
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {p.status}
                  </Badge>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
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
