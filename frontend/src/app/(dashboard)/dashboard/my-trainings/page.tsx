'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap, Clock, Calendar, Award, FileText,
  Search, ChevronRight, PlayCircle, CheckCircle2,
  BookOpen, Download, Percent,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  IN_PROGRESS: { label: 'En cours', variant: 'info' },
  COMPLETED: { label: 'Terminé', variant: 'success' },
  NOT_STARTED: { label: 'Non commencé', variant: 'warning' },
  CANCELLED: { label: 'Annulé', variant: 'danger' },
  PENDING: { label: 'En attente', variant: 'warning' },
};

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'not_started', label: 'À commencer' },
  { key: 'completed', label: 'Terminées' },
];

export default function MyTrainingsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['client-trainings'],
    queryFn: async () => {
      const res = await apiClient.getMyTrainings();
      return res.data.data;
    },
  });

  const trainings = useMemo(() => {
    const d = Array.isArray(data) ? data : (data?.trainings || data?.items || []);
    return d as any[];
  }, [data]);

  const stats = useMemo(() => ({
    total: trainings.length,
    inProgress: trainings.filter((t: any) => t.status === 'IN_PROGRESS').length,
    completed: trainings.filter((t: any) => t.status === 'COMPLETED').length,
    notStarted: trainings.filter((t: any) => t.status === 'NOT_STARTED' || t.status === 'PENDING').length,
    certificates: trainings.filter((t: any) => t.certificate).length,
    averageProgress: trainings.length > 0
      ? Math.round(trainings.reduce((sum: number, t: any) => sum + (t.progress || 0), 0) / trainings.length)
      : 0,
  }), [trainings]);

  const filtered = useMemo(() => {
    let f = [...trainings];
    switch (activeTab) {
      case 'in_progress': f = f.filter((t: any) => t.status === 'IN_PROGRESS'); break;
      case 'not_started': f = f.filter((t: any) => t.status === 'NOT_STARTED' || t.status === 'PENDING'); break;
      case 'completed': f = f.filter((t: any) => t.status === 'COMPLETED'); break;
    }
    if (search) {
      const q = search.toLowerCase();
      f = f.filter((t: any) =>
        t.title?.toLowerCase().includes(q) ||
        t.businessName?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    }
    return f;
  }, [trainings, activeTab, search]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Mes formations"
        description="Suivez votre progression et accédez à vos certificats"
        breadcrumbs={[{ label: 'Formations' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
              <PlayCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">En cours</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.inProgress}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Terminées</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.completed}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">À commencer</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.notStarted}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Certificats</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.certificates}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Progression moy.</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.averageProgress}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.key
                  ? 'bg-brand text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {tab.label}
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

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-12 w-12" />}
          title="Aucune formation"
          description={
            search
              ? 'Essayez une autre recherche'
              : "Vous n'êtes inscrit à aucune formation. Explorez les formations disponibles sur la marketplace."
          }
          action={
            <Link href="/dashboard/explore">
              <Button>Découvrir des formations</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((training: any) => {
            const statusInfo = STATUS_CONFIG[training.status] || { label: training.status, variant: 'default' as const };
            const progress = training.progress || 0;

            return (
              <Card key={training.id} className="p-5 hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center text-purple-600 shrink-0">
                    <GraduationCap className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {training.title || 'Formation'}
                          </h3>
                          <Badge variant={statusInfo.variant} size="xs">
                            {statusInfo.label}
                          </Badge>
                          {training.category && (
                            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                              {training.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {training.businessName || training.instructor || training.business || 'Formateur'}
                        </p>

                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">Progression</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-700',
                                progress === 100 ? 'bg-emerald-500' : 'bg-brand'
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-2">
                        {training.duration && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                            <Clock className="h-3.5 w-3.5" />
                            {training.duration}
                          </div>
                        )}
                        {training.lessons && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                            <BookOpen className="h-3.5 w-3.5" />
                            {training.lessons} leçons
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <Link href={training.url || '#'}>
                        <Button size="xs" variant="primary">
                          {training.status === 'COMPLETED' ? (
                            <>
                              <FileText className="h-3 w-3 mr-1" />
                              Revoir
                            </>
                          ) : training.status === 'IN_PROGRESS' ? (
                            <>
                              <PlayCircle className="h-3 w-3 mr-1" />
                              Continuer
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-3 w-3 mr-1" />
                              Commencer
                            </>
                          )}
                        </Button>
                      </Link>
                      {training.certificate && (
                        <Button size="xs" variant="secondary">
                          <Download className="h-3 w-3 mr-1" />
                          Certificat
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
