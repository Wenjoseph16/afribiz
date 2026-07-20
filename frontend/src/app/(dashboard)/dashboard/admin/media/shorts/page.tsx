'use client';

import { useState, useMemo } from 'react';
import {
  Video,
  PlayCircle,
  ThumbsUp,
  Eye,
  Bookmark,
  Search,
  Trash2,
  AlertTriangle,
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
  SUSPENDED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  REPORTED: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PENDING: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function useShortsList(page: number, limit: number) {
  return useQuery({
    queryKey: ['admin', 'shorts', page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/shorts');
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

export default function AdminShortsPage() {
  const qc = useQueryClient();
  const [deleteShortId, setDeleteShortId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading, error, refetch } = useShortsList(page, limit);
  const shorts = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/shorts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'shorts'] }),
  });

  const filtered = useMemo(() => {
    if (!search) return shorts;
    const q = search.toLowerCase();
    return shorts.filter(
      (s: any) => s.business?.name?.toLowerCase().includes(q) || s.title?.toLowerCase().includes(q)
    );
  }, [shorts, search]);

  const stats = useMemo(
    () => ({
      total: data?.total ?? 0,
      totalViews: shorts.reduce((sum: number, s: any) => sum + (s.views || 0), 0),
      totalLikes: shorts.reduce((sum: number, s: any) => sum + (s.likes || 0), 0),
      totalSaves: shorts.reduce((sum: number, s: any) => sum + (s.bookmarks || s.saves || 0), 0),
    }),
    [data, shorts]
  );

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Shorts"
        description="Gérez les vidéos courtes"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Média', href: '/dashboard/admin/media' },
          { label: 'Shorts' },
        ]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total shorts',
            value: stats.total,
            icon: Video,
            color: 'bg-brand-50 dark:bg-brand-900/30 text-brand',
          },
          {
            label: 'Vues totales',
            value: stats.totalViews.toLocaleString(),
            icon: Eye,
            color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600',
          },
          {
            label: 'Likes totaux',
            value: stats.totalLikes.toLocaleString(),
            icon: ThumbsUp,
            color: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600',
          },
          {
            label: 'Sauvegardes',
            value: stats.totalSaves.toLocaleString(),
            icon: Bookmark,
            color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600',
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
                {filtered.map((short: any) => (
                  <div
                    key={short.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-rose-50 dark:from-brand-900/30 dark:to-rose-900/30 flex items-center justify-center shrink-0">
                        <Video className="h-5 w-5 text-brand" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {short.title || 'Short'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {short.business?.name || '—'} ·{' '}
                          {short.duration ? `${short.duration}s` : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                      <span className="flex items-center gap-1">
                        <PlayCircle className="h-3 w-3" />
                        {short.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {short.likes || 0}
                      </span>
                      <Badge
                        variant={
                          short.isReported ? 'warning' : short.isActive ? 'success' : 'default'
                        }
                        size="xs"
                      >
                        {short.isActive
                          ? 'ACTIF'
                          : short.isReported
                            ? 'SIGNALÉ'
                            : short.status || 'INACTIF'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setDeleteShortId(short.id)}
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
              icon={<Video className="h-10 w-10" />}
              title="Aucun short"
              description={search ? 'Essayez une autre recherche' : 'Aucun short disponible.'}
            />
          )}
        </Card>
      )}
      <ConfirmationModal
        open={!!deleteShortId}
        onClose={() => setDeleteShortId(null)}
        onConfirm={async () => {
          if (deleteShortId) {
            await deleteMutation.mutateAsync(deleteShortId);
            setDeleteShortId(null);
          }
        }}
        title="Supprimer le short"
        description="Êtes-vous sûr de vouloir supprimer ce short ? Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
