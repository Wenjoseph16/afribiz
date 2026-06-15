'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Columns, List, CalendarDays, Clock, Loader,
  AlertTriangle, CheckCircle2, Users, BarChart3, TrendingUp,
  Timer, GanttChartSquare,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatsCard } from '@/components/dashboard/StatsCard';

import { cn } from '@/lib/utils';
import { useKanbanBoard, useTaskStats } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

type ViewMode = 'kanban' | 'list' | 'calendar' | 'timeline';

const columnOrder = ['TODO', 'IN_PROGRESS', 'ON_HOLD', 'VALIDATION', 'DONE', 'BLOCKED', 'CANCELLED'];

const columnLabels: Record<string, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  ON_HOLD: 'En attente',
  VALIDATION: 'Validation',
  DONE: 'Terminé',
  BLOCKED: 'Bloqué',
  CANCELLED: 'Annulé',
};

const statusColors: Record<string, string> = {
  TODO: 'border-l-gray-400 bg-gray-50 dark:bg-gray-800/30',
  IN_PROGRESS: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
  ON_HOLD: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
  VALIDATION: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
  DONE: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10',
  BLOCKED: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
  CANCELLED: 'border-l-gray-500 bg-gray-100 dark:bg-gray-700/30',
};

const priorityBadge: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400',
};

const statusBadge: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ON_HOLD: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  VALIDATION: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400',
};

const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getWeekDays(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const totalDays = lastDay.getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) week.push(null);
  for (let d = 1; d <= totalDays; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isOverdue(dueDate: string) {
  return new Date(dueDate) < new Date();
}

export default function TasksPage() {
  const [view, setView] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const { data: kanbanData, isLoading: kanbanLoading } = useKanbanBoard(debouncedSearch);
  const { data: statsData, isLoading: statsLoading } = useTaskStats();

  const columns = (kanbanData as any)?.columns || {};
  const allTasks = useMemo(() => {
    const tasks: any[] = [];
    Object.values(columns).forEach((col: any) => {
      (col?.tasks || []).forEach((t: any) => tasks.push(t));
    });
    return tasks;
  }, [columns]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    setTimeout(() => setDebouncedSearch(val), 300);
  };

  const monthGrid = useMemo(() => getMonthGrid(calendarYear, calendarMonth), [calendarYear, calendarMonth]);
  const monthLabel = new Date(calendarYear, calendarMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear((y) => y - 1); }
    else setCalendarMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear((y) => y + 1); }
    else setCalendarMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const weekDays = useMemo(() => getWeekDays(new Date()), []);
  const today = new Date();

  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    return allTasks.filter((t: any) => t.dueDate && isSameDay(new Date(t.dueDate), selectedDay));
  }, [selectedDay, allTasks]);

  const getTasksForDay = (day: Date) => allTasks.filter((t: any) => t.dueDate && isSameDay(new Date(t.dueDate), day));

  const todayDate = new Date().toDateString();
  const tasksToday = allTasks.filter((t: any) => t.dueDate && new Date(t.dueDate).toDateString() === todayDate).length;
  const urgentCount = allTasks.filter((t: any) => t.priority === 'URGENT').length;
  const doneCount = allTasks.filter((t: any) => t.status === 'DONE').length;
  const overdueCount = allTasks.filter((t: any) => t.status !== 'DONE' && t.dueDate && isOverdue(t.dueDate)).length;
  const completionRate = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0;

  const isLoading = kanbanLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }



  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tâches"
        description="Gérez, organisez et suivez toutes vos opérations"
        gradient
        actions={
          <Link href="/dashboard/tasks/new">
            <Button><Plus className="h-4 w-4" /> Nouvelle tâche</Button>
          </Link>
        }
      />

      {/* SECTION A — Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          label="Tâches aujourd'hui"
          value={statsData?.tasksToday ?? tasksToday}
        />
        <StatsCard
          icon={<AlertTriangle className="h-5 w-5" />}
          iconColor="text-red-600"
          iconBg="bg-red-50 dark:bg-red-900/30"
          label="Tâches urgentes"
          value={statsData?.urgentTasks ?? urgentCount}
        />
        <StatsCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          label="Tâches terminées"
          value={statsData?.doneTasks ?? doneCount}
        />
        <StatsCard
          icon={<Timer className="h-5 w-5" />}
          iconColor="text-orange-600"
          iconBg="bg-orange-50 dark:bg-orange-900/30"
          label="En retard"
          value={statsData?.overdueTasks ?? overdueCount}
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor="text-purple-600"
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          label="Productivité"
          value={`${statsData?.completionRate ?? completionRate}%`}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une tâche..."
            value={search}
            onChange={handleSearchChange}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
            {(['kanban', 'list', 'calendar', 'timeline'] as ViewMode[]).map((m) => {
              const Icon = viewIcons[m];
              return (
                <button
                  key={m}
                  onClick={() => setView(m)}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    view === m
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-brand'
                      : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  )}
                  title={m === 'kanban' ? 'Kanban' : m === 'list' ? 'Liste' : m === 'calendar' ? 'Calendrier' : 'Timeline'}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
          <Link href="/dashboard/tasks/new">
            <Button size="sm"><Plus className="h-4 w-4" /> Nouvelle tâche</Button>
          </Link>
        </div>
      </div>

      {/* View content */}
      {view === 'kanban' && <KanbanView columns={columns} allTasks={allTasks} />}
      {view === 'list' && <ListView tasks={allTasks} />}
      {view === 'calendar' && (
        <CalendarView
          monthGrid={monthGrid}
          monthLabel={monthLabel}
          calendarYear={calendarYear}
          calendarMonth={calendarMonth}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          selectedDay={selectedDay}
          onSelectDay={(d) => setSelectedDay(d)}
          getTasksForDay={getTasksForDay}
          selectedDayTasks={selectedDayTasks}
        />
      )}
      {view === 'timeline' && (
        <TimelineView weekDays={weekDays} getTasksForDay={getTasksForDay} today={today} />
      )}
    </div>
  );
}

const viewIcons: Record<ViewMode, any> = {
  kanban: Columns,
  list: List,
  calendar: CalendarDays,
  timeline: GanttChartSquare,
};

/* ===================== KANBAN ===================== */
function KanbanView({ columns, allTasks }: { columns: Record<string, any>; allTasks: any[] }) {
  const hasTasks = Object.values(columns).some((col: any) => (col?.tasks || []).length > 0);

  if (!hasTasks) {
    return (
      <Card padding="lg">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
            <Columns className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucune tâche</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Commencez par créer une nouvelle tâche.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
      {columnOrder.map((colId) => {
        const col = columns[colId];
        const colTasks = col?.tasks || [];
        return (
          <div key={colId} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{columnLabels[colId]}</h3>
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{colTasks.length}</span>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {colTasks.map((task: any) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {colTasks.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  Aucune tâche
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  const isPastDue = task.dueDate && task.status !== 'DONE' && isOverdue(task.dueDate);
  return (
    <Link
      key={task.id}
      href={`/dashboard/tasks/${task.id}`}
      className={cn(
        'block p-3 rounded-xl border border-gray-200 dark:border-gray-700 border-l-4',
        statusColors[task.status] || 'border-l-gray-400',
        'hover:shadow-md transition-all duration-200'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{task.title}</p>
        {task.priority && (
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0', priorityBadge[task.priority] || '')}>
            {task.priority}
          </span>
        )}
      </div>
      {task.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between text-[11px] text-gray-400">
        <span>
          {task.assignee
            ? `${task.assignee.firstName ?? ''} ${task.assignee.lastName ?? ''}`.trim() || 'Non assigné'
            : 'Non assigné'}
        </span>
        {task.dueDate && (
          <span className={cn(isPastDue && 'text-red-500 font-semibold')}>
            {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
    </Link>
  );
}

/* ===================== LISTE ===================== */
function ListView({ tasks }: { tasks: any[] }) {
  if (tasks.length === 0) {
    return (
      <Card padding="lg">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
            <List className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucune tâche</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucune tâche trouvée.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">Tâche</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">Priorité</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">Statut</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">Assigné à</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">Échéance</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {tasks.map((task: any) => {
              const isPastDue = task.dueDate && task.status !== 'DONE' && isOverdue(task.dueDate);
              return (
                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{task.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {task.priority && (
                      <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded', priorityBadge[task.priority])}>
                        {task.priority}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded', statusBadge[task.status] || '')}>
                      {columnLabels[task.status] || task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {task.assignee
                      ? `${task.assignee.firstName ?? ''} ${task.assignee.lastName ?? ''}`.trim() || 'Non assigné'
                      : 'Non assigné'}
                  </td>
                  <td className={cn('px-4 py-3', isPastDue ? 'text-red-500 font-semibold' : 'text-gray-600 dark:text-gray-400')}>
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/tasks/${task.id}`}
                      className="text-brand hover:text-brand-700 text-xs font-semibold"
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ===================== CALENDRIER ===================== */
function CalendarView({
  monthGrid,
  monthLabel,
  calendarYear,
  calendarMonth,
  onPrevMonth,
  onNextMonth,
  selectedDay,
  onSelectDay,
  getTasksForDay,
  selectedDayTasks,
}: {
  monthGrid: (number | null)[][];
  monthLabel: string;
  calendarYear: number;
  calendarMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  selectedDay: Date | null;
  onSelectDay: (d: Date | null) => void;
  getTasksForDay: (d: Date) => any[];
  selectedDayTasks: any[];
}) {
  return (
    <div className="space-y-4">
      <Card padding="md">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onPrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
          >
            <Clock className="h-4 w-4 rotate-180" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">{monthLabel}</h3>
          <button
            onClick={onNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
          >
            <Clock className="h-4 w-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {monthGrid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => {
                if (day === null) return <div key={`e-${di}`} />;
                const date = new Date(calendarYear, calendarMonth, day);
                const isToday = isSameDay(date, new Date());
                const isSelected = selectedDay && isSameDay(date, selectedDay);
                const dayTasks = getTasksForDay(date);
                return (
                  <button
                    key={day}
                    onClick={() => onSelectDay(isSelected ? null : date)}
                    className={cn(
                      'relative p-2 rounded-lg text-sm transition-all text-left min-h-[60px]',
                      isSelected && 'ring-2 ring-brand bg-brand-50 dark:bg-brand-900/20',
                      !isSelected && isToday && 'bg-gray-100 dark:bg-gray-700 font-semibold',
                      !isSelected && !isToday && 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <span
                      className={cn(
                        'text-xs',
                        isToday ? 'text-brand' : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {day}
                    </span>
                    {dayTasks.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {dayTasks.length <= 3 ? (
                          dayTasks.map((t: any) => (
                            <div
                              key={t.id}
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                t.priority === 'URGENT' ? 'bg-red-500' : 'bg-brand'
                              )}
                            />
                          ))
                        ) : (
                          <span className="text-[10px] font-semibold text-brand">{dayTasks.length}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      {/* Selected day tasks */}
      {selectedDay && (
        <Card padding="md">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Tâches du {selectedDay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h4>
          {selectedDayTasks.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucune tâche pour ce jour.</p>
          ) : (
            <div className="space-y-2">
              {selectedDayTasks.map((task: any) => (
                <Link
                  key={task.id}
                  href={`/dashboard/tasks/${task.id}`}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 border-l-4',
                    statusColors[task.status] || 'border-l-gray-400',
                    'hover:shadow-sm transition-all'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {task.assignee
                        ? `${task.assignee.firstName ?? ''} ${task.assignee.lastName ?? ''}`.trim() || 'Non assigné'
                        : 'Non assigné'}
                    </p>
                  </div>
                  {task.priority && (
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0', priorityBadge[task.priority])}>
                      {task.priority}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/* ===================== TIMELINE ===================== */
function TimelineView({
  weekDays,
  getTasksForDay,
  today,
}: {
  weekDays: Date[];
  getTasksForDay: (d: Date) => any[];
  today: Date;
}) {
  return (
    <Card padding="md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Cette semaine</h3>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, i) => {
          const dayTasks = getTasksForDay(day);
          const isToday = isSameDay(day, today);
          return (
            <div
              key={i}
              className={cn(
                'rounded-xl border border-gray-200 dark:border-gray-700 p-3 min-h-[200px]',
                isToday && 'border-brand/30 bg-brand-50/30 dark:bg-brand-900/10'
              )}
            >
              <div className="text-center mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">{dayNames[i]}</p>
                <p
                  className={cn(
                    'text-lg font-bold',
                    isToday ? 'text-brand' : 'text-gray-900 dark:text-gray-100'
                  )}
                >
                  {day.getDate()}
                </p>
              </div>
              <div className="space-y-1.5">
                {dayTasks.length === 0 ? (
                  <p className="text-[11px] text-gray-400 text-center pt-4">Aucune tâche</p>
                ) : (
                  dayTasks.slice(0, 4).map((task: any) => {
                    const isPastDue = task.dueDate && task.status !== 'DONE' && isOverdue(task.dueDate);
                    return (
                      <Link
                        key={task.id}
                        href={`/dashboard/tasks/${task.id}`}
                        className="block p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <p className="text-[11px] font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {task.priority && (
                            <span
                              className={cn(
                                'text-[9px] font-semibold px-1 py-0.5 rounded',
                                priorityBadge[task.priority]
                              )}
                            >
                              {task.priority}
                            </span>
                          )}
                          {isPastDue && <AlertTriangle className="h-2.5 w-2.5 text-red-500" />}
                        </div>
                      </Link>
                    );
                  })
                )}
                {dayTasks.length > 4 && (
                  <p className="text-[11px] text-brand font-semibold text-center">
                    +{dayTasks.length - 4} autres
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
