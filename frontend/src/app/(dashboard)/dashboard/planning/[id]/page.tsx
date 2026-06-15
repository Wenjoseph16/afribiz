'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, CalendarDays, Clock, User, Flag,
  AlertCircle, Trash2, Loader, History, TrendingUp, Activity, CheckCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';

type DetailTab = 'info' | 'history';
import { usePlanningTask, useDeletePlanningTask } from '@/features/hooks';
import { useRouter } from 'next/navigation';

const priorityConfig = {
  LOW: { color: 'text-gray-500 bg-gray-100 dark:bg-gray-800', label: 'Basse', icon: Flag },
  MEDIUM: { color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', label: 'Moyenne', icon: Flag },
  HIGH: { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', label: 'Haute', icon: AlertCircle },
  URGENT: { color: 'text-red-600 bg-red-50 dark:bg-red-900/20', label: 'Urgente', icon: AlertCircle },
};

const statusConfig = {
  PENDING: { color: 'text-gray-500 bg-gray-100 dark:bg-gray-800', label: 'En attente' },
  IN_PROGRESS: { color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', label: 'En cours' },
  COMPLETED: { color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', label: 'Terminée' },
  CANCELLED: { color: 'text-red-600 bg-red-50 dark:bg-red-900/20', label: 'Annulée' },
};

export default function PlanningTaskDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const { data: task, isLoading, error, refetch } = usePlanningTask(id);
  const deleteTask = useDeletePlanningTask();
  const router = useRouter();
  const now = new Date();
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [deleting, setDeleting] = useState(false);

  if (!params?.id) return <ErrorState message="Tâche introuvable" />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!task) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-500">Tâche introuvable</p></div>;

  const t: any = task;
  const dueDate = new Date(t.dueDate);
  const createdAt = new Date(t.createdAt);
  const isOverdue = t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && dueDate < new Date();
  const pConf = priorityConfig[t.priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
  const sConf = statusConfig[t.status as keyof typeof statusConfig] || statusConfig.PENDING;

  const handleDelete = async () => {
    if (!confirm('Supprimer cette tâche ?')) return;
    setDeleting(true);
    try { await deleteTask.mutateAsync(id); router.push('/dashboard/planning'); } catch (err) { console.error(err); setDeleting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/planning" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/planning/${id}/edit`}>
            <Button size="sm" variant="outline"><Pencil className="h-4 w-4 mr-1.5" />Modifier</Button>
          </Link>
          <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting} className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-1.5" />{deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-brand-700 to-emerald-800 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">{t.title}</h1>
            {isOverdue && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/30 text-white">🔴 En retard</span>
            )}
            {t.createdAt && new Date(t.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/30 text-white">🆕 Nouveau</span>
            )}
            <div className="flex flex-wrap gap-4 text-sm opacity-90">
              {t.assignee && <div className="flex items-center gap-1.5"><User className="h-4 w-4" />{t.assignee}</div>}
              <div className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Échéance : {dueDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              {isOverdue && <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-red-300" />En retard</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('px-3 py-1 rounded-full text-xs font-medium', pConf.color.replace('text-', 'text-white ').replace('bg-', 'bg-').split(' ').slice(0, 2).join(' '))}>
              {pConf.label}
            </span>
            <span className={cn('px-3 py-1 rounded-full text-xs font-medium', sConf.color.replace('text-', 'text-white ').replace('bg-', 'bg-').split(' ').slice(0, 2).join(' '))}>
              {sConf.label}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1">
        {([
          { key: 'info', label: 'Informations', icon: CheckCircle },
          { key: 'history', label: 'Historique', icon: History },
        ] as { key: DetailTab; label: string; icon: any }[]).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}>
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="lg" className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Description</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{t.description || 'Aucune description.'}</p>
          </Card>

          <div className="space-y-4">
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Détails</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Priorité</span>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', pConf.color)}>{pConf.label}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Statut</span>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', sConf.color)}>{sConf.label}</span>
                </div>
                {t.assignee && <div className="flex justify-between"><span className="text-gray-500">Assigné à</span><span className="font-medium text-gray-900 dark:text-gray-100">{t.assignee}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Échéance</span><span className={cn('font-medium', isOverdue ? 'text-red-500' : 'text-gray-900 dark:text-gray-100')}>{dueDate.toLocaleDateString('fr-FR')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Créée le</span><span className="font-medium text-gray-900 dark:text-gray-100">{createdAt.toLocaleDateString('fr-FR')}</span></div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                  <CalendarDays className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Créée le</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {createdAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <Flag className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Priorité</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pConf.label}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <User className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Assignée à</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.assignee || '—'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <Activity className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Âge</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {(() => {
                      const diff = now.getTime() - createdAt.getTime();
                      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
                      if (days >= 30) return `${Math.floor(days / 30)} mois`;
                      return `${days} jour${days > 1 ? 's' : ''}`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Chronologie</h3>
            <div className="space-y-3">
              {[
                { date: createdAt, label: 'Tâche créée', icon: History },
                { date: dueDate, label: 'Date d\'échéance', icon: Clock },
                { date: t.updatedAt ? new Date(t.updatedAt) : null, label: 'Dernière modification', icon: TrendingUp },
              ].filter(item => item.date).map((item, i, arr) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center',
                      i === 0 ? 'bg-brand-100 dark:bg-brand-900/30 text-brand' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    )}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    {i < arr.length - 1 && <div className="w-0.5 h-6 bg-gray-200 dark:bg-gray-700" />}
                  </div>
                  <div className="pt-1.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                    <p className="text-xs text-gray-500">
                      {item.date?.toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
