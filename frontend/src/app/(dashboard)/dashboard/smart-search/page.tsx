'use client';

import { useQuery } from '@tanstack/react-query';
import { Search, Clock, TrendingUp, Trash2, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';
import { useState } from 'react';

export default function SmartSearchPage() {
  const [query, setQuery] = useState('');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['search-history'],
    queryFn: async () => {
      const res = await apiClient.getSmartSearchHistory();
      return res.data.data;
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const history = Array.isArray(data) ? data : (data?.history ?? []);
  const trending = data?.trending ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Recherche intelligente"
        description="Historique et tendances de recherche"
        breadcrumbs={[{ label: 'Recherche' }]}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Historique" titleIcon={<Clock className="h-4 w-4" />}>
          {history.length === 0 ? (
            <EmptyState
              icon={<Search className="h-10 w-10" />}
              title="Aucune recherche"
              description="Votre historique de recherche apparaîtra ici"
            />
          ) : (
            <div className="space-y-1">
              {history.map((h: any, i: number) => (
                <div
                  key={h.id || i}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-sm">{h.query}</span>
                  </div>
                  <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Tendances" titleIcon={<TrendingUp className="h-4 w-4" />}>
          {trending.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-10 w-10" />}
              title="Aucune tendance"
              description="Les recherches populaires apparaîtront ici"
            />
          ) : (
            <div className="space-y-2">
              {trending.map((t: any, i: number) => (
                <div
                  key={t.id || i}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <span className="w-5 text-center text-sm font-bold text-brand">{i + 1}</span>
                  <span className="text-sm flex-1">{t.query || t.term}</span>
                  <span className="text-xs text-gray-400">{t.count ?? 0} recherches</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
