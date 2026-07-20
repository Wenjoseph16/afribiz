'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, CheckCheck, Trash2, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

const severityIcons: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

export default function AlertsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      try {
        const res = await apiClient.getAlerts();
        return res.data.data || { alerts: [] };
      } catch {
        return { alerts: [] };
      }
    },
    retry: false,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.markAlertRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const removeAlert = useMutation({
    mutationFn: (id: string) => apiClient.deleteAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const alerts = Array.isArray(data) ? data : (data?.alerts ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Alertes"
        description="Centre de notifications et alertes système"
        breadcrumbs={[{ label: 'Alertes' }]}
        actions={
          alerts.some((a: any) => !a.read) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                alerts.forEach((a: any) => {
                  if (!a.read) markRead.mutate(a.id);
                })
              }
            >
              <CheckCheck className="h-4 w-4 mr-1.5" />
              Tout marquer lu
            </Button>
          )
        }
      />

      <Card title="Alertes récentes" titleIcon={<Bell className="h-4 w-4" />}>
        {alerts.length === 0 ? (
          <EmptyState
            icon={<BellOff className="h-10 w-10" />}
            title="Aucune alerte"
            description="Vous serez notifié en cas d'événement important"
          />
        ) : (
          <div className="space-y-2">
            {alerts.map((alert: any) => {
              const SeverityIcon = severityIcons[alert.severity] || Info;
              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all ${alert.read ? 'bg-gray-50 dark:bg-gray-800/30' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'}`}
                >
                  <div
                    className={`p-1.5 rounded-full mt-0.5 ${
                      alert.severity === 'critical'
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : alert.severity === 'warning'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}
                  >
                    <SeverityIcon
                      className={`h-4 w-4 ${
                        alert.severity === 'critical'
                          ? 'text-red-600'
                          : alert.severity === 'warning'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{alert.title}</p>
                      {!alert.read && <span className="w-2 h-2 rounded-full bg-brand" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!alert.read && (
                      <button
                        onClick={() => markRead.mutate(alert.id)}
                        className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeAlert.mutate(alert.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
