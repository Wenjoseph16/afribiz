'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import ModuleCharts from '@/components/dashboard/ModuleCharts';
import type { ModuleChartData } from '@/components/dashboard/ModuleCharts';
import { Search, BookOpen, Plus, Clock, CheckCircle, Play, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CopilotTips } from '@/components/copilot/CopilotTips';

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'info' | 'default' }
> = {
  NOT_STARTED: { label: 'Non commencé', variant: 'default' },
  IN_PROGRESS: { label: 'En cours', variant: 'warning' },
  COMPLETED: { label: 'Terminé', variant: 'success' },
  CANCELLED: { label: 'Annulé', variant: 'default' },
};

const TABS = ['Toutes', 'En cours', 'Terminées', 'Non commencées'];

export default function TrainingsPage() {
  const [activeTab, setActiveTab] = useState('Toutes');
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-trainings'],
    queryFn: async () => {
      const res = await apiClient.getMyTrainings();
      return res.data.data?.trainings || [];
    },
  });

  const trainings = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    let filtered = list;
    if (activeTab === 'En cours') filtered = list.filter((t: any) => t.status === 'IN_PROGRESS');
    else if (activeTab === 'Terminées')
      filtered = list.filter((t: any) => t.status === 'COMPLETED');
    else if (activeTab === 'Non commencées')
      filtered = list.filter((t: any) => t.status === 'NOT_STARTED');
    if (search)
      filtered = filtered.filter((t: any) => t.title?.toLowerCase().includes(search.toLowerCase()));
    return filtered;
  }, [data, activeTab, search]);

  const stats = useMemo(
    () => ({
      total: trainings.length,
      inProgress: trainings.filter((t: any) => t.status === 'IN_PROGRESS').length,
      completed: trainings.filter((t: any) => t.status === 'COMPLETED').length,
      avgProgress:
        trainings.length > 0
          ? Math.round(
              trainings.reduce((a: number, t: any) => a + (t.progress || 0), 0) / trainings.length
            )
          : 0,
      certified: trainings.filter((t: any) => t.certificate).length,
    }),
    [trainings]
  );

  // Charts data
  const chartData: ModuleChartData = useMemo(
    () => ({
      trend: [
        { label: 'Total', value: trainings.length },
        {
          label: 'En cours',
          value: trainings.filter((t: any) => t.status === 'IN_PROGRESS').length,
        },
        {
          label: 'Terminées',
          value: trainings.filter((t: any) => t.status === 'COMPLETED').length,
        },
        {
          label: 'Non commencées',
          value: trainings.filter((t: any) => t.status === 'NOT_STARTED').length,
        },
      ],
      distribution: [
        {
          name: 'En cours',
          value: trainings.filter((t: any) => t.status === 'IN_PROGRESS').length,
          color: '#f59e0b',
        },
        {
          name: 'Terminées',
          value: trainings.filter((t: any) => t.status === 'COMPLETED').length,
          color: '#10b981',
        },
        {
          name: 'Non commencées',
          value: trainings.filter((t: any) => t.status === 'NOT_STARTED').length,
          color: '#6b7280',
        },
        {
          name: 'Annulées',
          value: trainings.filter((t: any) => t.status === 'CANCELLED').length,
          color: '#ef4444',
        },
      ].filter((d) => d.value > 0),
      daily: [
        { label: 'Total', value: trainings.length },
        { label: 'Progression', value: stats.avgProgress },
        { label: 'Certifiées', value: stats.certified },
      ],
    }),
    [trainings, stats]
  );

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message="Erreur de chargement des formations" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Mes formations" description="Suivez votre progression d'apprentissage" />

      <CopilotTips moduleKey="TRAINING" />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<BookOpen className="h-5 w-5" />}
          iconBg="bg-brand/10"
          iconColor="text-brand"
          label="Total"
          value={stats.total}
        />
        <StatsCard
          icon={<Play className="h-5 w-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="En cours"
          value={stats.inProgress}
        />
        <StatsCard
          icon={<CheckCircle className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Terminées"
          value={stats.completed}
        />
        <StatsCard
          icon={<BarChart3 className="h-5 w-5" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          label="Progression"
          value={`${stats.avgProgress}%`}
        />
      </div>

      {/* Charts */}
      {trainings.length > 0 && (
        <ModuleCharts
          data={chartData}
          title="ANALYTICS FORMATIONS"
          trendLabel="Statut"
          distributionLabel="Répartition"
          dailyLabel="Vue d'ensemble"
          variant="rooms"
        />
      )}

      {/* Tabs & Search */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab
                  ? 'bg-brand text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {tab}
              <span
                className={cn(
                  'ml-1.5 text-xs',
                  activeTab === tab ? 'text-white/70' : 'text-gray-400'
                )}
              >
                {tab === 'Toutes'
                  ? stats.total
                  : tab === 'En cours'
                    ? stats.inProgress
                    : tab === 'Terminées'
                      ? stats.completed
                      : stats.total - stats.inProgress - stats.completed}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une formation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
          />
        </div>
      </div>

      {/* Trainings List */}
      {trainings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainings.map((training: any) => (
            <Link key={training.id} href={`/dashboard/trainings/${training.id}`}>
              <Card className="h-full hover:border-brand/30 transition-all duration-200 group">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={STATUS_CONFIG[training.status]?.variant || 'default'}>
                      {STATUS_CONFIG[training.status]?.label || training.status}
                    </Badge>
                    {training.certificate && <Badge variant="success">Certifié</Badge>}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-brand transition-colors">
                    {training.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-1">
                    {training.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {training.duration || 'À votre rythme'}
                    </span>
                    <span>{training.lessons || 0} leçons</span>
                  </div>
                  {training.progress > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Progression</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {training.progress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full transition-all duration-500"
                          style={{ width: `${training.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="Aucune formation"
          description="Explorez les formations disponibles sur le marketplace"
          action={
            <Link href="/dashboard/marketplace">
              <Button>
                <Plus className="h-4 w-4 mr-1.5" />
                Explorer
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
