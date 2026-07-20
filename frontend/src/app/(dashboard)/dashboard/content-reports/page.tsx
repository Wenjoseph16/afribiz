'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';
import { useState } from 'react';

export default function ContentReportsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['content-reports', filter],
    queryFn: async () => {
      const res = await apiClient.getContentReports({
        status: filter !== 'all' ? filter : undefined,
      });
      return res.data.data;
    },
  });

  const resolveReport = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      apiClient.resolveContentReport(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-reports'] }),
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const reports = Array.isArray(data) ? data : (data?.reports ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Signalements"
        description="Modérez les contenus signalés par les utilisateurs"
        breadcrumbs={[{ label: 'Signalements' }]}
      />

      <Card title="Signalements reçus" titleIcon={<Flag className="h-4 w-4" />}>
        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'pending', 'resolved', 'dismissed'].map((s) => (
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

        {reports.length === 0 ? (
          <EmptyState
            icon={<Flag className="h-10 w-10" />}
            title="Aucun signalement"
            description="Aucun contenu signalé pour le moment"
          />
        ) : (
          <div className="space-y-2">
            {reports.map((r: any) => (
              <div
                key={r.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.reason}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Signalé le {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge
                    variant={
                      r.status === 'pending'
                        ? 'warning'
                        : r.status === 'resolved'
                          ? 'success'
                          : 'default'
                    }
                  >
                    {r.status}
                  </Badge>
                  {r.status === 'pending' && (
                    <>
                      <button
                        onClick={() => resolveReport.mutate({ id: r.id, action: 'approve' })}
                        className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-500"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => resolveReport.mutate({ id: r.id, action: 'dismiss' })}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
