'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Bell,
  ShoppingBag,
  Calendar,
  Wallet,
  Package,
  Truck,
  FileText,
  MessageCircle,
  Star,
  RefreshCw,
  Activity,
  Users,
  CreditCard,
  Shield,
  Award,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  TrendingUp,
  Loader2,
  BarChart3,
  List,
  AlertOctagon,
  Download,
  Wifi,
  WifiOff,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const JOB_ICONS: Record<string, React.ComponentType<any>> = {
  'booking-reminders': Calendar,
  'overdue-debts': Wallet,
  'campaign-dispatch': Megaphone,
  'pending-orders': ShoppingBag,
  'abandoned-carts': ShoppingBag,
  'inactive-clients': Users,
  'copilot-alerts': Bell,
  'expiring-subscriptions': CreditCard,
  'expiring-trials': Clock,
  'overdue-rentals': Truck,
  'low-stock': Package,
  'setup-incomplete': FileText,
  birthdays: Star,
  'rental-returns': Truck,
  'delivery-starts': Truck,
  'expiring-documents': FileText,
  'satisfaction-surveys': MessageCircle,
  'escrow-release': Shield,
  'auto-escrow-release': Shield,
  'expire-stories': RefreshCw,
  'score-recalculation': TrendingUp,
  cleanup: RefreshCw,
  'inactive-accounts': Users,
  'morning-briefs': Clock,
  'evening-summaries': Clock,
  'urgency-alerts': AlertTriangle,
  'opportunity-detection': Award,
  'loyalty-points': Award,
};

const JOB_COLORS: Record<string, { icon: string; bg: string }> = {
  'booking-reminders': { icon: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  'overdue-debts': { icon: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  'campaign-dispatch': { icon: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  'expiring-subscriptions': {
    icon: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  'low-stock': { icon: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  'loyalty-points': { icon: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  'score-recalculation': { icon: 'text-brand', bg: 'bg-brand-50 dark:bg-brand-900/20' },
  cleanup: { icon: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800/50' },
};

const CATEGORIES = [
  { key: 'all', label: 'Toutes' },
  { key: 'client', label: 'Clients' },
  { key: 'sales', label: 'Ventes' },
  { key: 'finance', label: 'Finance' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'inventory', label: 'Stock' },
  { key: 'operations', label: 'Opérations' },
  { key: 'hr', label: 'RH' },
  { key: 'system', label: 'Système' },
];

type ViewMode = 'jobs' | 'activity' | 'executions' | 'failed';

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Jamais';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}min`;
}

export default function AdminCronMonitoringPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('jobs');
  const [connected, setConnected] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState<
    Array<{
      jobId: string;
      jobName: string;
      error: string;
      timestamp: string;
    }>
  >([]);
  const queryClient = useQueryClient();

  // WebSocket connection for live admin alerts
  useEffect(() => {
    let socket: any = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = async () => {
      try {
        // Get auth token from store
        const token = useAuthStore.getState().accessToken || '';

        // Connect via Socket.IO (using bundled socket.io-client or fallback)
        const { io } = await import('socket.io-client');
        const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        socket = io(socketUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
          setConnected(true);
        });

        socket.on(
          'cron:job-error',
          (data: { jobId: string; jobName: string; error: string; timestamp: string }) => {
            setLiveAlerts((prev) =>
              [{ ...data, timestamp: data.timestamp || new Date().toISOString() }, ...prev].slice(
                0,
                50
              )
            );
            // Auto-refresh les données
            queryClient.invalidateQueries({ queryKey: ['admin', 'cron'] });
          }
        );

        socket.on('disconnect', () => {
          setConnected(false);
        });

        socket.on('connect_error', () => {
          setConnected(false);
        });
      } catch {
        setConnected(false);
      }
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [queryClient]);

  const {
    data: statusData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'cron', 'status'],
    queryFn: async () => {
      const res = await apiClient.get('/automations/status');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const { data: activityData } = useQuery({
    queryKey: ['admin', 'cron', 'activity'],
    queryFn: async () => {
      const res = await apiClient.get('/automations/activity');
      return res.data.data as Array<{
        id: string;
        action: string;
        target: string;
        time: string;
        status: string;
      }>;
    },
    refetchInterval: 60000,
    enabled: viewMode === 'activity',
  });

  const { data: executionLogs } = useQuery({
    queryKey: ['admin', 'cron', 'execution-logs'],
    queryFn: async () => {
      const res = await apiClient.get('/automations/execution-logs?limit=50');
      return res.data.data as Array<{
        jobId: string;
        jobName: string;
        status: string;
        duration: number;
        error?: string;
        timestamp: string;
      }>;
    },
    refetchInterval: 60000,
    enabled: viewMode === 'executions',
  });

  const { data: failedJobs } = useQuery({
    queryKey: ['admin', 'cron', 'failed-jobs'],
    queryFn: async () => {
      const res = await apiClient.get('/automations/failed-jobs');
      return res.data.data as Array<{
        jobId: string;
        jobName: string;
        status: string;
        duration: number;
        error?: string;
        timestamp: string;
      }>;
    },
    refetchInterval: 15000,
    enabled: viewMode === 'failed',
  });

  const { data: errorRate } = useQuery({
    queryKey: ['admin', 'cron', 'error-rate'],
    queryFn: async () => {
      const res = await apiClient.get('/automations/error-rate');
      return res.data.data as { total: number; errors: number; rate: number };
    },
    refetchInterval: 60000,
  });

  const toggleMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiClient.patch(`/automations/${jobId}/toggle`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cron', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'cron', 'activity'] });
    },
  });

  const toggleJob = (jobId: string) => toggleMutation.mutate(jobId);

  const handleExportCSV = useCallback(async () => {
    try {
      const res = await apiClient.get('/automations/export-csv', {
        responseType: 'blob' as any,
      });
      const url = window.URL.createObjectURL(new Blob([(res as any).data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `cron-execution-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Silent fail for download
    }
  }, []);

  const jobs = statusData?.jobs || [];
  const summary = statusData?.summary || {
    total: 0,
    active: 0,
    inactive: 0,
    totalEvents: 0,
    totalErrors: 0,
  };
  const activityLog = activityData || [];
  const execLogs = executionLogs || [];
  const failed = failedJobs || [];
  const errRate = errorRate || { total: 0, errors: 0, rate: 0 };

  const filteredJobs = jobs.filter(
    (j: any) => activeCategory === 'all' || j.category === activeCategory
  );
  const activeCount = jobs.filter((j: any) => j.enabled).length;
  const totalEvents = jobs.reduce((s: number, j: any) => s + (j.todayCount || 0), 0);
  const totalErrors = jobs.reduce((s: number, j: any) => s + (j.errorCount || 0), 0);

  const viewTabs: Array<{ key: ViewMode; label: string; icon: React.ReactNode }> = [
    { key: 'jobs', label: 'Jobs', icon: <Activity className="h-4 w-4" /> },
    { key: 'activity', label: 'Activité', icon: <List className="h-4 w-4" /> },
    { key: 'executions', label: 'Exécutions', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'failed', label: 'Échecs', icon: <AlertOctagon className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Live Connection Banner */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors',
          connected
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
        )}
      >
        {connected ? (
          <>
            <Wifi className="h-3.5 w-3.5" /> Alertes temps réel connectées
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5" /> Alertes temps réel déconnectées
          </>
        )}
        {liveAlerts.length > 0 && (
          <span className="ml-auto font-semibold">
            {liveAlerts.length} alerte{liveAlerts.length > 1 ? 's' : ''} récente
            {liveAlerts.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Live Alerts Toast */}
      {liveAlerts.length > 0 && liveAlerts[0] && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 animate-slide-down">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                  🔴 Échec: {liveAlerts[0].jobName}
                </p>
                <span className="text-[10px] text-red-500 shrink-0">
                  {formatTimeAgo(liveAlerts[0].timestamp)}
                </span>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 truncate">
                {liveAlerts[0].error}
              </p>
            </div>
            <button
              onClick={() => setLiveAlerts((prev) => prev.slice(1))}
              className="text-red-400 hover:text-red-600 shrink-0"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <PageHeader
        title="Monitoring CRON"
        description="Supervisez en temps réel les automatisations système"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Monitoring CRON' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
              {viewTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setViewMode(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    viewMode === tab.key
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          icon={<Activity className="h-5 w-5" />}
          iconBg="bg-brand-50 dark:bg-brand-900/20"
          iconColor="text-brand"
          label="Jobs actifs"
          value={`${activeCount}/${summary.total || jobs.length}`}
        />
        <StatsCard
          icon={<Bell className="h-5 w-5" />}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          iconColor="text-blue-600"
          label="Événements aujourd'hui"
          value={totalEvents}
        />
        <StatsCard
          icon={
            errRate.rate > 10 ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )
          }
          iconBg={
            errRate.rate > 10
              ? 'bg-red-50 dark:bg-red-900/30'
              : 'bg-emerald-50 dark:bg-emerald-900/30'
          }
          iconColor={errRate.rate > 10 ? 'text-red-600' : 'text-emerald-600'}
          label="Taux d'erreur"
          value={summary.totalErrors > 0 ? `${errRate.rate}%` : '0%'}
        />
        <StatsCard
          icon={<AlertOctagon className="h-5 w-5" />}
          iconBg={
            totalErrors > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-gray-50 dark:bg-gray-800/50'
          }
          iconColor={totalErrors > 0 ? 'text-red-600' : 'text-gray-400'}
          label="Erreurs totales"
          value={totalErrors}
        />
        <StatsCard
          icon={connected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
          iconBg={
            connected ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-amber-50 dark:bg-amber-900/30'
          }
          iconColor={connected ? 'text-emerald-600' : 'text-amber-600'}
          label="Connexion temps réel"
          value={connected ? 'Connecté' : 'Déconnecté'}
        />
      </div>

      {/* Content by view mode */}
      {error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : (
        <>
          {viewMode === 'activity' && (
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Activité récente des automatisations
              </h3>
              <div className="space-y-1">
                {activityLog.length === 0 ? (
                  <EmptyState
                    icon={<Activity className="h-8 w-8" />}
                    title="Aucune activité"
                    description="Les logs d'activité apparaîtront ici après la prochaine exécution des jobs."
                  />
                ) : (
                  activityLog.map((entry) => {
                    const StatusIcon =
                      entry.status === 'success'
                        ? CheckCircle2
                        : entry.status === 'warning'
                          ? AlertTriangle
                          : entry.status === 'error'
                            ? XCircle
                            : Activity;
                    const statusColor =
                      entry.status === 'success'
                        ? 'text-emerald-600 bg-emerald-50'
                        : entry.status === 'warning'
                          ? 'text-amber-600 bg-amber-50'
                          : entry.status === 'error'
                            ? 'text-red-600 bg-red-50'
                            : 'text-blue-600 bg-blue-50';
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className={cn('p-1.5 rounded-lg shrink-0', statusColor)}>
                          <StatusIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {entry.action}
                            </p>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {formatTimeAgo(entry.time)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{entry.target}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          )}

          {viewMode === 'executions' && (
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Historique des exécutions
              </h3>
              {execLogs.length === 0 ? (
                <EmptyState
                  icon={<BarChart3 className="h-8 w-8" />}
                  title="Aucune exécution"
                  description="L'historique apparaîtra après la première exécution des jobs."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 px-2 font-medium text-gray-500">Job</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-500">Statut</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-500">Durée</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-500">Date</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-500">Erreur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {execLogs.map((log, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="py-2 px-2 font-medium text-gray-800 dark:text-gray-200">
                            {log.jobName}
                          </td>
                          <td className="py-2 px-2">
                            <Badge
                              variant={log.status === 'success' ? 'success' : 'danger'}
                              size="xs"
                            >
                              {log.status === 'success' ? 'Succès' : 'Échec'}
                            </Badge>
                          </td>
                          <td className="py-2 px-2 text-gray-600">
                            {formatDuration(log.duration)}
                          </td>
                          <td className="py-2 px-2 text-gray-500">
                            {formatTimeAgo(log.timestamp)}
                          </td>
                          <td className="py-2 px-2 text-red-600 max-w-[200px] truncate">
                            {log.error || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {viewMode === 'failed' && (
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Derniers échecs
              </h3>
              {failed.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />}
                  title="Aucun échec"
                  description="Tous les jobs s'exécutent correctement."
                />
              ) : (
                <div className="space-y-2">
                  {failed.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30"
                    >
                      <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                            {f.jobName}
                          </p>
                          <span className="text-[10px] text-red-500 shrink-0">
                            {formatTimeAgo(f.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {f.error?.substring(0, 300)}
                        </p>
                        <p className="text-[10px] text-red-400 mt-1">
                          Durée: {formatDuration(f.duration)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {viewMode === 'jobs' && (
            <>
              {/* Live Alerts Panel */}
              {liveAlerts.length > 0 && (
                <Card padding="md">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <AlertOctagon className="h-3.5 w-3.5 text-red-500" />
                      Alertes temps réel
                      <span className="text-red-600 font-bold text-sm">({liveAlerts.length})</span>
                    </h3>
                    <Button variant="ghost" size="xs" onClick={() => setLiveAlerts([])}>
                      Tout effacer
                    </Button>
                  </div>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {liveAlerts.map((alert, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 text-xs"
                      >
                        <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-red-800 dark:text-red-300">
                            {alert.jobName}:{' '}
                          </span>
                          <span className="text-red-600 dark:text-red-400">
                            {alert.error.substring(0, 150)}
                          </span>
                        </div>
                        <span className="text-[10px] text-red-400 shrink-0">
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Category filter */}
              <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                      activeCategory === cat.key
                        ? 'bg-brand text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Jobs grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredJobs.map((job: any) => {
                  const Icon = JOB_ICONS[job.id] || Activity;
                  const colorClass = JOB_COLORS[job.id] || {
                    icon: 'text-gray-600',
                    bg: 'bg-gray-50 dark:bg-gray-800/50',
                  };
                  const enabled = job.enabled !== false;
                  const hasErrors = (job.errorCount || 0) > 0;
                  return (
                    <Card
                      key={job.id}
                      className={cn('p-4 transition-all', enabled ? 'opacity-100' : 'opacity-60')}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn('p-2 rounded-lg', colorClass.bg)}>
                            <Icon className={cn('h-5 w-5', colorClass.icon)} />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {job.name}
                            </h3>
                            <p className="text-[10px] text-gray-400">{job.category}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleJob(job.id)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            enabled
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          )}
                          title={enabled ? 'Désactiver' : 'Activer'}
                        >
                          {enabled ? (
                            <Play className="h-3.5 w-3.5" />
                          ) : (
                            <Pause className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                        {job.description}
                      </p>
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-400">Planification</span>
                          <span className="font-medium text-gray-600 dark:text-gray-300">
                            {job.schedule}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-400">Dernière exécution</span>
                          <span className="font-medium text-gray-600 dark:text-gray-300">
                            {formatTimeAgo(job.lastRun)}
                          </span>
                        </div>
                        {enabled && (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-400">Aujourd'hui</span>
                            <span className="font-medium text-emerald-600">
                              {job.todayCount || 0} événements
                            </span>
                          </div>
                        )}
                        {hasErrors && (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-400">Erreurs</span>
                            <span className="font-medium text-red-600">{job.errorCount || 0}</span>
                          </div>
                        )}
                        {job.lastError && (
                          <div className="flex items-center gap-1 text-[10px] text-red-500 mt-1">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span className="truncate">{job.lastError}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <Badge variant={enabled ? 'success' : 'default'} size="xs">
                          {enabled ? 'Actif' : 'Inactif'}
                        </Badge>
                        {hasErrors && (
                          <Badge variant="danger" size="xs">
                            {job.errorCount} erreur{job.errorCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                        <span className="text-[9px] font-mono text-gray-400 ml-auto">
                          {job.cron}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {filteredJobs.length === 0 && (
                <EmptyState
                  icon={<Activity className="h-12 w-12" />}
                  title="Aucune automatisation"
                  description="Aucun job trouvé dans cette catégorie."
                />
              )}
            </>
          )}
        </>
      )}

      {/* System status summary */}
      {!isLoading && !error && (
        <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800/30">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-sm shrink-0">
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                État du système d'automatisation
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
                <div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Jobs</p>
                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                    {summary.total || 0} total
                  </p>
                </div>
                <div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    Actifs
                  </p>
                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                    {activeCount}/{summary.total || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    Événements
                  </p>
                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                    {summary.totalEvents || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    Taux d'erreur
                  </p>
                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                    {errRate.rate}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    Alertes live
                  </p>
                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                    {liveAlerts.length}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="xs" variant="secondary" onClick={handleExportCSV}>
                  <Download className="h-3 w-3" />
                  Export CSV
                </Button>
                <Button size="xs" variant="secondary" onClick={() => refetch()}>
                  <RefreshCw className="h-3 w-3" />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
