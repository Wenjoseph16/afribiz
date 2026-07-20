'use client';

import { useQuery } from '@tanstack/react-query';
import { Bookmark, Heart, BookmarkX, FolderOpen } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';
import { useState } from 'react';

export default function SavedItemsPage() {
  const [filter, setFilter] = useState('all');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['saved-items', filter],
    queryFn: async () => {
      const res = await apiClient.getSavedItems({ type: filter !== 'all' ? filter : undefined });
      return res.data.data;
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const items = Array.isArray(data) ? data : (data?.items ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Éléments sauvegardés"
        description="Retrouvez vos publications et contenus enregistrés"
        breadcrumbs={[{ label: 'Sauvegardes' }]}
      />

      <Card title="Mes sauvegardes" titleIcon={<Bookmark className="h-4 w-4" />}>
        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'post', 'story', 'short', 'product', 'event'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filter === t
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-10 w-10" />}
            title="Aucun élément sauvegardé"
            description="Sauvegardez vos publications préférées pour les retrouver ici"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="relative group p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.title || 'Sans titre'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{item.type}</p>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all">
                    <BookmarkX className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Ajouté le {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
