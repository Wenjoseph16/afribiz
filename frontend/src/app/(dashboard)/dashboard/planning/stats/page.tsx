'use client';

import { useMemo } from 'react';
import { BarChart3, CheckCircle, Clock, AlertCircle, User, CalendarDays, Target, TrendingUp, Loader } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { usePlanningStats, usePlanningTasks, usePlanningSchedules } from '@/features/hooks';

const DAYS_LABEL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function PlanningStatsPage() {
  const { data: statsData, isLoading } = usePlanningStats();
  const { data: tasksData } = usePlanningTasks({ limit: 500 });
  const { data: schedulesData } = usePlanningSchedules({ limit: 500 });

  const tasks = useMemo(() => {
    const raw = Array.isArray(tasksData) ? tasksData : (tasksData?.tasks || tasksData?.data || []) as any[];
    return raw;
  }, [tasksData]);

  const schedules = useMemo(() => {
    const raw = Array.isArray(schedulesData) ? schedulesData : (schedulesData?.schedules || schedulesData?.data || []) as any[];
    return raw;
  }, [schedulesData]);

  const stats = (statsData?.data || statsData) as any || {};

  const now = new Date();
  const overdueTasks = tasks.filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && t.dueDate && new Date(t.dueDate) < now);
  const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED');
  const pendingTasks = tasks.filter((t: any) => t.status === 'PENDING');
  const inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS');

  const taskCompletionRate = tasks.length > 0 ? Math.round(completedTasks.length / tasks.length * 100) : 0;
  const overdueRate = tasks.length > 0 ? Math.round(overdueTasks.length / tasks.length * 100) : 0;
  const uniqueEmployees = new Set(tasks.map((t: any) => t.assignee).filter(Boolean)).size;

  const statusData = [
    { label: 'Terminées', count: completedTasks.length, color: 'bg-emerald-500' },
    { label: 'En cours', count: inProgressTasks.length, color: 'bg-blue-500' },
    { label: 'En attente', count: pendingTasks.length, color: 'bg-amber-500' },
    { label: 'En retard', count: overdueTasks.length, color: 'bg-red-500' },
  ];

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistiques planning</h1>
        <p className="text-sm text-gray-500">Analysez la performance de votre planning et de vos équipes</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand/10"><BarChart3 className="w-4 h-4 text-brand" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold">Total tâches</p><p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalTasks ?? tasks.length}</p></div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold">Terminées</p><p className="text-lg font-bold text-gray-900 dark:text-white">{completedTasks.length}</p></div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100"><AlertCircle className="w-4 h-4 text-red-600" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold">En retard</p><p className="text-lg font-bold text-gray-900 dark:text-white">{overdueTasks.length}</p></div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100"><User className="w-4 h-4 text-purple-600" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold">Employés</p><p className="text-lg font-bold text-gray-900 dark:text-white">{uniqueEmployees}</p></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion bar */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Target className="w-4 h-4" />Taux de complétion</h3>
          <div className="text-center mb-4">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{taskCompletionRate}%</p>
            <p className="text-xs text-gray-500 mt-1">des tâches sont terminées</p>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${taskCompletionRate}%` }} />
          </div>
          <div className="mt-3 text-xs text-gray-500 flex justify-between">
            <span>{completedTasks.length} terminées</span>
            <span>{tasks.length - completedTasks.length} restantes</span>
          </div>
        </Card>

        {/* Status distribution */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4">Distribution par statut</h3>
          <div className="space-y-3">
            {statusData.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{s.label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{s.count} ({tasks.length > 0 ? Math.round(s.count / tasks.length * 100) : 0}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', s.color)} style={{ width: `${tasks.length > 0 ? (s.count / tasks.length * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Overdue rate */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4" />Taux de retard</h3>
          <div className="text-center mb-4">
            <p className={cn('text-4xl font-bold', overdueRate > 20 ? 'text-red-500' : overdueRate > 10 ? 'text-amber-500' : 'text-emerald-500')}>{overdueRate}%</p>
            <p className="text-xs text-gray-500 mt-1">des tâches sont en retard</p>
          </div>
          {overdueTasks.length > 0 && (
            <div className="space-y-1 mt-3">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Tâches en retard :</p>
              {overdueTasks.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400 truncate max-w-[180px]">{t.title}</span>
                  <span className="text-red-500 font-medium">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('fr-FR') : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Schedules summary */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Clock className="w-4 h-4" />Couverture des horaires</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{schedules.length}</p>
            <p className="text-[10px] text-gray-500">Horaires créés</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueEmployees}</p>
            <p className="text-[10px] text-gray-500">Employés planifiés</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{new Set(schedules.map((s: any) => s.dayOfWeek)).size}</p>
            <p className="text-[10px] text-gray-500">Jours couverts /7</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{schedules.filter((s: any) => s.isActive !== false).length}</p>
            <p className="text-[10px] text-gray-500">Horaires actifs</p>
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/30">
        <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Suggestions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {overdueRate > 20 && (
            <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">⚠️ Trop de tâches en retard</p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">{overdueTasks.length} tâches sont en retard. Envisagez de redistribuer les priorités.</p>
            </div>
          )}
          {uniqueEmployees > 0 && tasks.length > 0 && (
            <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">📊 Charge de travail</p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">{Math.round(tasks.length / uniqueEmployees)} tâches par employé en moyenne.</p>
            </div>
          )}
          <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-300">📅 Suggestion planning</p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">{schedules.length === 0 ? 'Créez des horaires pour mieux organiser vos équipes.' : `${DAYS_LABEL[schedules[0]?.dayOfWeek - 1] || ''} : ${schedules.filter((s: any) => s.isActive !== false).length} horaires actifs.`}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

