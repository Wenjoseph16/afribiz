'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  AlertTriangle,
  RefreshCw,
  Download,
  AlertOctagon,
  FileText,
  Loader,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/ToastProvider';
import { AnalyticsKpiCards } from '@/components/notifications/AnalyticsKpiCards';
import { VolumeChart } from '@/components/notifications/VolumeChart';
import { TypePieChart } from '@/components/notifications/TypePieChart';
import { FailureRateChart } from '@/components/notifications/FailureRateChart';
import {
  ReadBarChart,
  DeliveryPieChart,
  ChannelBarChart,
} from '@/components/notifications/DeliveryCharts';
import { TypeChannelBarChart } from '@/components/notifications/TypeChannelBar';

const CACHE_KEY = 'afribiz_notification_analytics';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCache(): { data: any; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCache(data: any) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // ignore storage errors
  }
}

const PIE_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ef4444',
  '#f97316',
  '#84cc16',
];

export default function NotificationAnalyticsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [dateRange, setDateRange] = useState<'7d' | '30d'>('30d');
  const { addToast } = useToast();
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['notification-analytics', dateRange],
    queryFn: async () => {
      const cached = getCache();
      if (cached?.data) return cached.data;
      const res = await apiClient.get('/notifications/analytics');
      setCache(res.data.data);
      return res.data.data;
    },
    enabled: isAdmin,
    staleTime: 60_000,
  });

  const [failureMsg, setFailureMsg] = useState<string | null>(null);
  const [failureLoading, setFailureLoading] = useState(false);

  const handleExportCSV = useCallback(async () => {
    try {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/notifications/analytics/export-csv`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'notifications-export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast({
        title: 'Export CSV réussi',
        variant: 'success',
        description: `${(blob.size / 1024).toFixed(0)} Ko téléchargés`,
      });
    } catch (err) {
      addToast({
        title: "Échec de l'export CSV",
        variant: 'error',
        description: 'Vérifiez votre connexion',
      });
      console.error('CSV export failed', err);
    }
  }, [addToast]);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const element = chartRef.current;
      if (!element) {
        addToast({ title: 'Rien à exporter', variant: 'error' });
        return;
      }
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a3');
      const imgWidth = 420;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save('notification-analytics.pdf');
      addToast({
        title: 'Export PDF réussi',
        variant: 'success',
        description: 'Graphiques exportés en PDF',
      });
    } catch (err) {
      addToast({
        title: "Échec de l'export PDF",
        variant: 'error',
        description: 'Erreur lors de la génération',
      });
      console.error('PDF export failed', err);
    } finally {
      setIsExporting(false);
    }
  }, [addToast]);

  const handleCheckFailure = useCallback(async () => {
    setFailureLoading(true);
    setFailureMsg(null);
    try {
      const res = await apiClient.get('/notifications/analytics/check-failure-rate');
      const msg = res.data.data.message;
      setFailureMsg(msg);
      addToast({
        title: res.data.data.alertSent ? 'Alerte déclenchée' : 'Vérification OK',
        variant: res.data.data.alertSent ? 'error' : 'success',
        description: msg,
      });
      setTimeout(() => setFailureMsg(null), 7000);
    } catch {
      setFailureMsg('Erreur lors de la vérification');
      addToast({
        title: 'Erreur',
        variant: 'error',
        description: "Impossible de vérifier le taux d'échec",
      });
      setTimeout(() => setFailureMsg(null), 5000);
    } finally {
      setFailureLoading(false);
    }
  }, [addToast]);

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Analyses des notifications
        </h1>
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title="Accès réservé"
          description="Administrateurs uniquement."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-16">
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-3">Erreur lors du chargement</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const volumeByDay = data?.volumeByDay || [];
  const typeDistribution = data?.typeDistribution || [];
  const deliveryStats = data?.deliveryStats || {};
  const typeChannelDistribution = data?.typeChannelDistribution || [];
  const totalByChannel = data?.totalByChannel || [];
  const failureRateByDay = data?.failureRateByDay || [];

  const channels = [...new Set(typeChannelDistribution.map((t: any) => t.channel))] as string[];
  const types = [...new Set(typeChannelDistribution.map((t: any) => t.type))] as string[];
  const typeChannelData = types.map((type: any) => {
    const entry: any = { type };
    channels.forEach((ch: any) => {
      entry[ch] =
        typeChannelDistribution.find((t: any) => t.type === type && t.channel === ch)?.count || 0;
    });
    return entry;
  });

  return (
    <div className="space-y-6 animate-fade-in" ref={chartRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Analyses des notifications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Statistiques et tendances des notifications push
            {dataUpdatedAt && (
              <span className="ml-2 text-xs text-gray-400">
                · Mis à jour{' '}
                {new Date(dataUpdatedAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
            {(['7d', '30d'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDateRange(d)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  dateRange === d
                    ? 'bg-brand text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700'
                }`}
              >
                {d === '7d' ? '7 jours' : '30 jours'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} title="Export CSV">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            isLoading={isExporting}
            title="Export PDF"
          >
            <FileText className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckFailure}
            isLoading={failureLoading}
            title="Vérifier taux d'échec"
          >
            <AlertOctagon className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Failure message toast inline */}
      {failureMsg && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium animate-slide-in ${
            failureMsg.includes('⚠️') || failureMsg.includes('Erreur')
              ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/30'
              : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/30'
          }`}
        >
          {failureMsg}
        </div>
      )}

      {/* KPI Cards */}
      <AnalyticsKpiCards summary={summary} />

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volume over time */}
        <VolumeChart data={volumeByDay} />

        {/* Type distribution - Donut Chart */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Distribution par type
            </h3>
          </div>
          <TypePieChart data={typeDistribution.map((t: any) => ({ ...t, name: t.type }))} />
        </Card>
      </div>

      {/* Row 2: Read/Unread + Delivery + Channel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ReadBarChart read={summary.read || 0} unread={summary.unread || 0} />
        <DeliveryPieChart
          sent={deliveryStats.sent || 0}
          failed={deliveryStats.failed || 0}
          pending={deliveryStats.pending || 0}
        />
        <ChannelBarChart channels={totalByChannel} />
      </div>

      {/* Failure Rate Chart */}
      {failureRateByDay.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FailureRateChart data={failureRateByDay} threshold={10} />
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <AlertOctagon className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Statut livraison
              </h3>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "Taux d'échec global",
                  value: `${summary.failureRate || 0}%`,
                  color: (summary.failureRate || 0) > 10 ? 'text-red-600' : 'text-emerald-600',
                },
                { label: 'Seuil critique', value: '10%', color: 'text-gray-500' },
                {
                  label: 'Envoyées (30j)',
                  value: (deliveryStats.sent || 0).toLocaleString(),
                  color: 'text-emerald-600',
                },
                {
                  label: 'Échouées (30j)',
                  value: (deliveryStats.failed || 0).toLocaleString(),
                  color: (deliveryStats.failed || 0) > 0 ? 'text-red-600' : 'text-gray-500',
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                  <span className={`text-sm font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Type x Channel distribution */}
      {typeChannelData.length > 0 && (
        <TypeChannelBarChart data={typeChannelData} channels={channels} />
      )}

      {/* Export hints */}
      <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-100 dark:border-gray-800">
        Données mises à jour en temps réel · Export CSV des dernières 5000 notifications · Export
        PDF des graphiques · Cache rafraîchi toutes les 5 minutes
      </div>
    </div>
  );
}
