'use client';

import { useState, useMemo } from 'react';
import {
  Radio,
  Wifi,
  WifiOff,
  Calendar,
  Eye,
  Clock,
  XCircle,
  Star,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  LIVE: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SCHEDULED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ENDED: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  CANCELLED: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function useLivesList(page: number, limit: number) {
  return useQuery({
    queryKey: ['admin', 'lives', page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/lives');
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

export default function AdminLivesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading, error, refetch } = useLivesList(page, limit);
  const lives = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.put(`/admin/lives/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'lives'] }),
  });

  const filtered = useMemo(() => {
    if (!search) return lives;
    const q = search.toLowerCase();
    return lives.filter(
      (l: any) => l.business?.name?.toLowerCase().includes(q) || l.title?.toLowerCase().includes(q)
    );
  }, [lives, search]);

  const stats = useMemo(
    () => ({
      total: data?.total ?? 0,
      liveNow: lives.filter((l: any) => l.status === 'LIVE').length,
      totalViewers: lives.reduce((sum: number, l: any) => sum + (l.viewers || 0), 0),
      totalDuration: lives.reduce((sum: number, l: any) => sum + (l.duration || 0), 0),
    }),
    [data, lives]
  );

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Lives"
        description="Gérez les lives des utilisateurs"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Média', href: '/dashboard/admin/media' },
          { label: 'Lives' },
        ]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total lives',
            value: stats.total,
            icon: Radio,
            color: 'bg-brand-50 dark:bg-brand-900/30 text-brand',
          },
          {
            label: 'En direct',
            value: stats.liveNow,
            icon: Wifi,
            color: 'bg-red-50 dark:bg-red-900/30 text-red-600',
          },
          {
            label: 'Spectateurs',
            value: stats.totalViewers.toLocaleString(),
            icon: Users,
            color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600',
          },
          {
            label: 'Durée totale',
            value: `${Math.round(stats.totalDuration / 60)} min`,
            icon: Clock,
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
                {filtered.map((live: any) => (
                  <div
                    key={live.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 flex items-center justify-center shrink-0">
                        <Radio className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {live.title || 'Live'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {live.business?.name || '—'} ·{' '}
                          {live.startTime
                            ? new Date(live.startTime).toLocaleDateString('fr-FR')
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {live.viewers || 0}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          STATUS_STYLES[live.status] || 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {live.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      {live.status === 'LIVE' && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => statusMutation.mutate({ id: live.id, status: 'ENDED' })}
                          title="Terminer"
                        >
                          <XCircle className="h-3.5 w-3.5 text-gray-400" />
                        </Button>
                      )}
                      {live.status === 'SCHEDULED' && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => statusMutation.mutate({ id: live.id, status: 'LIVE' })}
                          title="Démarrer"
                        >
                          <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                        </Button>
                      )}
                      {live.status === 'SCHEDULED' && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            statusMutation.mutate({ id: live.id, status: 'CANCELLED' })
                          }
                          title="Annuler"
                        >
                          <XCircle className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      )}
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
              icon={<Radio className="h-10 w-10" />}
              title="Aucun live"
              description={search ? 'Essayez une autre recherche' : 'Aucun live disponible.'}
            />
          )}
        </Card>
      )}
    </div>
  );
}
