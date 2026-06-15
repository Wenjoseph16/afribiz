'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CheckCircle, Clock, AlertCircle, Flag, Plus, Search,
  Grid3X3, List, Eye, Pencil, User, CalendarDays, Loader,
  TrendingUp, Zap, AlertTriangle,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { usePlanningTasks, usePlanningStats } from '@/features/hooks';

interface PlanningTask {
  id: string; title: string; description: string; assignee: string;
  dueDate: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'; createdAt: string;
}

type TabType = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

const priorityConfig = {
  LOW: { color: 'text-gray-500 bg-gray-100 dark:bg-gray-800', label: 'Basse' },
  MEDIUM: { color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', label: 'Moyenne' },
  HIGH: { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', label: 'Haute' },
  URGENT: { color: 'text-red-600 bg-red-50 dark:bg-red-900/20', label: 'Urgente' },
};

const statusConfig = {
  PENDING: { color: 'text-gray-500 bg-gray-100 dark:bg-gray-800', label: 'En attente' },
  IN_PROGRESS: { color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', label: 'En cours' },
  COMPLETED: { color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', label: 'Terminée' },
  CANCELLED: { color: 'text-red-600 bg-red-50 dark:bg-red-900/20', label: 'Annulée' },
};

export default function PlanningPage() {
  const { data: tasksData, isLoading, error, refetch } = usePlanningTasks();
  const { data: statsData } = usePlanningStats();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const allTasks: PlanningTask[] = Array.isArray(tasksData) ? tasksData : (tasksData?.tasks || tasksData?.data || []);

  const stats = statsData || {
    total: allTasks.length,
    completed: allTasks.filter(t => t.status === 'COMPLETED').length,
    pending: allTasks.filter(t => t.status === 'PENDING').length,
    overdue: allTasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < new Date()).length,
  };

  const filtered = useMemo(() => {
    let f = [...allTasks];
    switch (activeTab) {
      case 'pending': f = f.filter(t => t.status === 'PENDING'); break;
      case 'in_progress': f = f.filter(t => t.status === 'IN_PROGRESS'); break;
      case 'completed': f = f.filter(t => t.status === 'COMPLETED'); break;
      case 'cancelled': f = f.filter(t => t.status === 'CANCELLED'); break;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(t => t.title.toLowerCase().includes(q) || t.assignee?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    return f;
  }, [allTasks, activeTab, searchQuery]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Planification</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez vos tâches et planning</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard/planning/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouvelle tâche</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard icon={<CheckCircle className="h-5 w-5" />} iconBg="bg-brand-50" iconColor="text-brand" label="Total" value={stats.total} />
        <StatsCard icon={<Flag className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Terminées" value={stats.completed} />
        <StatsCard icon={<Clock className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" label="En attente" value={stats.pending} />
        <StatsCard icon={<AlertCircle className="h-5 w-5" />} iconBg="bg-red-50" iconColor="text-red-600" label="En retard" value={stats.overdue} />
      </div>

      {/* Suggestions intelligentes */}
      {allTasks.length > 0 && (() => {
        const now = new Date();
        const overdue = allTasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < now);
        const inProgress = allTasks.filter(t => t.status === 'IN_PROGRESS');
        const pending = allTasks.filter(t => t.status === 'PENDING');
        const urgentOrHigh = allTasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH');

        const suggestions = [
          overdue.length > 0 && {
            type: 'overdue', icon: AlertTriangle,
            title: `${overdue.length} tâche${overdue.length > 1 ? 's' : ''} en retard`,
            desc: 'Action prioritaire requise pour ces échéances dépassées',
            color: 'red',
          },
          inProgress.length > 0 && {
            type: 'in_progress', icon: TrendingUp,
            title: `${inProgress.length} tâche${inProgress.length > 1 ? 's' : ''} en cours`,
            desc: 'Suivez l\'avancement et les prochaines étapes',
            color: 'blue',
          },
          pending.length > 0 && {
            type: 'pending', icon: Clock,
            title: `${pending.length} tâche${pending.length > 1 ? 's' : ''} en attente`,
            desc: 'À démarrer dès que possible',
            color: 'amber',
          },
          urgentOrHigh.length > 0 && {
            type: 'urgent', icon: Zap,
            title: `${urgentOrHigh.length} tâche${urgentOrHigh.length > 1 ? 's' : ''} haute priorité`,
            desc: 'Priorités à traiter en premier',
            color: 'purple',
          },
        ].filter(Boolean);

        if (suggestions.length === 0) return null;

        const colorMap: Record<string, string> = {
          red: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
          blue: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
          amber: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
          purple: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
        };

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s: any, i) => (
              <Link key={i} href={s.link || '/dashboard/planning'}
                className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${colorMap[s.color]} border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all duration-200`}>
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm shrink-0">
                  <s.icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        );
      })()}


      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {(['all', 'pending', 'in_progress', 'completed', 'cancelled'] as TabType[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>
              {tab === 'all' ? 'Toutes' : tab === 'pending' ? 'En attente' : tab === 'in_progress' ? 'En cours' : tab === 'completed' ? 'Terminées' : 'Annulées'}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher une tâche..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
          </div>
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('grid')}
              className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-brand text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500')}>
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={cn('p-2 transition-colors', viewMode === 'list' ? 'bg-brand text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500')}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucune tâche trouvée</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'Essayez une autre recherche' : 'Créez votre première tâche'}
          </p>
          <Link href="/dashboard/planning/new"><Button><Plus className="h-4 w-4 mr-1.5" />Nouvelle tâche</Button></Link>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tâche</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigné à</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Échéance</th>
                <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Priorité</th>
                <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="p-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getBadge(task: PlanningTask): { label: string; class: string } | null {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dueDate = new Date(task.dueDate);
  const isOverdue = task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && dueDate < new Date();
  const isNew = task.createdAt && new Date(task.createdAt) > thirtyDaysAgo;
  
  // Priorité: En retard > Urgent > Nouveau
  if (isOverdue) return { label: '🔴 En retard', class: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300' };
  if (task.priority === 'URGENT') return { label: '⚡ Urgent', class: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-300' };
  if (isNew) return { label: '🆕 Nouveau', class: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300' };
  return null;
}

function TaskCard({ task }: { task: PlanningTask }) {
  const dueDate = new Date(task.dueDate);
  const isOverdue = task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && dueDate < new Date();
  const pConf = priorityConfig[task.priority];
  const sConf = statusConfig[task.status];
  const badge = getBadge(task);
  return (
    <Link href={`/dashboard/planning/${task.id}`}
      className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand/30 hover:shadow-sm transition-all duration-200">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{task.title}</h3>
            {badge && <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0', badge.class)}>{badge.label}</span>}
          </div>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', pConf.color)}>{pConf.label}</span>
        </div>
        {task.assignee && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <User className="h-3.5 w-3.5" />
            {task.assignee}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CalendarDays className="h-3.5 w-3.5" />
          <span className={cn(isOverdue && 'text-red-500 font-medium')}>
            {dueDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            {isOverdue && ' (En retard)'}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', sConf.color)}>
            {sConf.label}
          </span>
        </div>
      </div>
    </Link>
  );
}

function TaskRow({ task }: { task: PlanningTask }) {
  const dueDate = new Date(task.dueDate);
  const isOverdue = task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && dueDate < new Date();
  const pConf = priorityConfig[task.priority];
  const sConf = statusConfig[task.status];
  const badge = getBadge(task);
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5 text-brand" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
            <p className="text-xs text-gray-500">{task.description?.slice(0, 60)}{task.description?.length > 60 ? '...' : ''}</p>
            {badge && <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 inline-block', badge.class)}>{badge.label}</span>}
          </div>
        </div>
      </td>
      <td className="p-4"><span className="text-sm text-gray-600 dark:text-gray-300">{task.assignee || '-'}</span></td>
      <td className="p-4">
        <span className={cn('text-sm', isOverdue ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-300')}>
          {dueDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </td>
      <td className="p-4 text-center">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', pConf.color)}>{pConf.label}</span>
      </td>
      <td className="p-4 text-center">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', sConf.color)}>{sConf.label}</span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/dashboard/planning/${task.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors">
            <Eye className="h-4 w-4" />
          </Link>
          <Link href={`/dashboard/planning/${task.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors">
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}
