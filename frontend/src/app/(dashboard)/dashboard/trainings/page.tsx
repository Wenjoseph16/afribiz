'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { Search, BookOpen, Plus, Clock, CheckCircle, Play, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'default' }> = {
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
    else if (activeTab === 'Terminées') filtered = list.filter((t: any) => t.status === 'COMPLETED');
    else if (activeTab === 'Non commencées') filtered = list.filter((t: any) => t.status === 'NOT_STARTED');
    if (search) filtered = filtered.filter((t: any) => t.title?.toLowerCase().includes(search.toLowerCase()));
    return filtered;
  }, [data, activeTab, search]);

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message="Erreur de chargement des formations" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes formations"
        description="Suivez votre progression d'apprentissage"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: trainings.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'En cours', value: trainings.filter((t: any) => t.status === 'IN_PROGRESS').length, icon: Play, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Terminées', value: trainings.filter((t: any) => t.status === 'COMPLETED').length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Progression moy.', value: trainings.length > 0 ? `${Math.round(trainings.reduce((a: number, t: any) => a + (t.progress || 0), 0) / trainings.length)}%` : '—', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-lg', stat.bg)}>
                  <Icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                activeTab === tab ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
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
                    {training.certificate && (
                      <Badge variant="success">Certifié</Badge>
                    )}
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
                        <span className="font-medium text-gray-900 dark:text-gray-100">{training.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${training.progress}%` }} />
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
              <Button><Plus className="h-4 w-4 mr-1.5" />Explorer</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
