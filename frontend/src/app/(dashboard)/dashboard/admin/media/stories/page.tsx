'use client';

import { useState, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle,
  Archive,
  Trash2,
  Clock,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  EXPIRED: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  REPORTED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ARCHIVED: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function useStoriesList(page: number, limit: number) {
  return useQuery({
    queryKey: ['admin', 'stories', page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/stories');
      const items = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.items ?? []);
      const start = (page - 1) * limit;
      return {
        items: items.slice(start, start + limit),
        total: items.length,
        page,
        limit,
        totalPages: Math.ceil(items.length / limit),
      };
    },
  });
}

export default function AdminStoriesPage() {
  const qc = useQueryClient();
  const [deleteStoryId, setDeleteStoryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading, error, refetch } = useStoriesList(page, limit);
  const stories = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.put(`/admin/stories/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'stories'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/stories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'stories'] }),
  });

  const filtered = useMemo(() => {
    if (!search) return stories;
    const q = search.toLowerCase();
    return stories.filter(
      (s: any) =>
        s.business?.name?.toLowerCase().includes(q) || s.mediaUrl?.toLowerCase().includes(q)
    );
  }, [stories, search]);

  const stats = useMemo(() => {
    const all = data
      ? (() => {
          const arr = Array.isArray(data) ? data : (data?.items ?? []);
          return arr;
        })()
      : [];
    return {
      total: data?.total ?? 0,
      actives: stories.filter((s: any) => s.isActive || s.status === 'ACTIVE').length,
      reported: stories.filter((s: any) => s.status === 'REPORTED' || s.isReported).length,
      totalViews: stories.reduce((sum: number, s: any) => sum + (s.views || 0), 0),
    };
  }, [data, stories]);

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Stories"
        description="Gérez les stories des utilisateurs"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Média', href: '/dashboard/admin/media' },
          { label: 'Stories' },
        ]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total stories',
            value: stats.total,
            icon: BookOpen,
            color: 'bg-brand-50 dark:bg-brand-900/30 text-brand',
          },
          {
            label: 'Actives',
            value: stats.actives,
            icon: CheckCircle,
            color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600',
          },
          {
            label: 'Signalées',
            value: stats.reported,
            icon: AlertTriangle,
            color: 'bg-red-50 dark:bg-red-900/30 text-red-600',
          },
          {
            label: 'Vues totales',
            value: stats.totalViews.toLocaleString(),
            icon: Eye,
            color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600',
          },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2.5 rounded-lg', s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        />
      </div>

      {isLoading ? (
        <Loader className="py-20" />
      ) : (
        <Card padding="none">
          {filtered.length > 0 ? (
            <div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((story: any) => (
                  <div
                    key={story.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/30 dark:to-purple-900/30 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                        {(story.business?.name || '?')[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {story.business?.name || '—'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {story.mediaUrl?.substring(0, 60) || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {story.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="h-3 w-3" />
                        {story.clicks || 0}
                      </span>
                      <Badge
                        variant={
                          story.isReported ? 'danger' : story.isActive ? 'success' : 'default'
                        }
                        size="xs"
                      >
                        {story.isActive
                          ? 'ACTIF'
                          : story.isReported
                            ? 'SIGNALÉ'
                            : story.status || 'INACTIF'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      {story.isActive && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            statusMutation.mutate({ id: story.id, status: 'ARCHIVED' })
                          }
                          title="Archiver"
                        >
                          <Archive className="h-3.5 w-3.5 text-gray-400" />
                        </Button>
                      )}
                      {!story.isActive && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => statusMutation.mutate({ id: story.id, status: 'ACTIVE' })}
                          title="Activer"
                        >
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setDeleteStoryId(story.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </button>
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-lg transition-colors',
                        p === page
                          ? 'bg-brand text-white'
                          : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="h-10 w-10" />}
              title="Aucune story"
              description={search ? 'Essayez une autre recherche' : 'Aucune story disponible.'}
            />
          )}
        </Card>
      )}
      <ConfirmationModal
        open={!!deleteStoryId}
        onClose={() => setDeleteStoryId(null)}
        onConfirm={async () => {
          if (deleteStoryId) {
            await deleteMutation.mutateAsync(deleteStoryId);
            setDeleteStoryId(null);
          }
        }}
        title="Supprimer la story"
        description="Êtes-vous sûr de vouloir supprimer cette story ? Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
