'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Loader, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { usePlanningTasks } from '@/features/hooks';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-500', HIGH: 'bg-amber-500', MEDIUM: 'bg-blue-500', LOW: 'bg-gray-400',
};

export default function CalendarViewPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const { data: tasksData, isLoading } = usePlanningTasks({ limit: 200 });

  const tasks = useMemo(() => {
    const raw = Array.isArray(tasksData) ? tasksData : (tasksData?.tasks || tasksData?.data || []) as any[];
    return raw;
  }, [tasksData]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday first
  const daysInMonth = lastDay.getDate();

  const calendarDays = useMemo(() => {
    const days: { date: Date; tasks: any[] }[] = [];
    for (let i = 0; i < startOffset; i++) {
      const d = new Date(year, month, -startOffset + i + 1);
      days.push({ date: d, tasks: [] });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dayTasks = tasks.filter((t: any) => {
        if (!t.dueDate) return false;
        const td = new Date(t.dueDate);
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth() && td.getDate() === d.getDate();
      });
      days.push({ date: d, tasks: dayTasks });
    }
    return days;
  }, [year, month, daysInMonth, startOffset, tasks]);

  const navigate = (delta: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + delta);
    setCurrentDate(d);
  };

  const todayStr = today.toDateString();
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return { date: d, tasks: tasks.filter((t: any) => {
        if (!t.dueDate) return false;
        const td = new Date(t.dueDate);
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth() && td.getDate() === d.getDate();
      })};
    });
  }, [currentDate, tasks]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendrier</h1><p className="text-sm text-gray-500">Vue globale des tâches et planning</p></div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button onClick={() => setView('month')} className={cn('px-3 py-1.5 text-xs font-medium transition-colors', view === 'month' ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800')}>Mois</button>
            <button onClick={() => setView('week')} className={cn('px-3 py-1.5 text-xs font-medium transition-colors', view === 'week' ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800')}>Semaine</button>
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Aujourd'hui</button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{MONTHS[month]} {year}</h2>
        <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronRight className="w-5 h-5 text-gray-500" /></button>
      </div>

      {/* Month View */}
      {view === 'month' && (
        <Card className="p-4">
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
            {DAYS.map(d => <div key={d} className="bg-white dark:bg-gray-800 p-2 text-center text-xs font-semibold text-gray-500 uppercase">{d}</div>)}
            {calendarDays.map((day, i) => {
              const isToday = day.date.toDateString() === todayStr;
              const isOtherMonth = day.date.getMonth() !== month;
              return (
                <div key={i} className={cn('bg-white dark:bg-gray-800 p-1.5 min-h-[80px] border-t border-gray-100 dark:border-gray-700/50', isOtherMonth && 'opacity-40')}>
                  <p className={cn('text-xs font-medium mb-1', isToday ? 'bg-brand text-white w-5 h-5 rounded-full flex items-center justify-center' : 'text-gray-500')}>{day.date.getDate()}</p>
                  <div className="space-y-0.5">
                    {day.tasks.slice(0, 3).map((t: any) => (
                      <Link key={t.id} href={`/dashboard/planning/${t.id}`}
                        className={cn('block text-[9px] px-1 py-0.5 rounded text-white truncate', priorityColors[t.priority] || 'bg-gray-400')}>
                        {t.title}
                      </Link>
                    ))}
                    {day.tasks.length > 3 && <p className="text-[9px] text-gray-400 px-1">+{day.tasks.length - 3} autres</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="space-y-3">
          {weekDays.map((day, i) => {
            const isToday = day.date.toDateString() === todayStr;
            return (
              <Card key={i} className={cn('p-3', isToday && 'ring-1 ring-brand/20')}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn('px-2 py-1 rounded-lg text-xs font-bold', isToday ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300')}>
                    {DAYS[i]} {day.date.getDate()}
                  </div>
                  <span className="text-xs text-gray-400">{day.tasks.length} tâche(s)</span>
                </div>
                {day.tasks.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">Aucune tâche</p>
                ) : (
                  <div className="space-y-1">
                    {day.tasks.map((t: any) => {
                      const isOverdue = t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate) < new Date();
                      return (
                        <Link key={t.id} href={`/dashboard/planning/${t.id}`}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-2 h-2 rounded-full', priorityColors[t.priority] || 'bg-gray-400')} />
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {t.assignee && <span className="text-[10px] text-gray-400 flex items-center gap-1"><User className="w-3 h-3" />{t.assignee}</span>}
                            {isOverdue && <span className="text-[9px] text-red-500 font-medium">Retard</span>}
                            {t.status === 'COMPLETED' && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Mini stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-brand/10"><CalendarDays className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500">Tâches ce mois</p><p className="text-sm font-bold">{calendarDays.reduce((s, d) => s + d.tasks.length, 0)}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-red-100"><AlertCircle className="w-4 h-4 text-red-600" /></div><div><p className="text-[10px] text-gray-500">En retard</p><p className="text-sm font-bold">{tasks.filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && t.dueDate && new Date(t.dueDate) < new Date()).length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-emerald-100"><CheckCircle className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500">Terminées</p><p className="text-sm font-bold">{tasks.filter((t: any) => t.status === 'COMPLETED').length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-amber-100"><Clock className="w-4 h-4 text-amber-600" /></div><div><p className="text-[10px] text-gray-500">En cours</p><p className="text-sm font-bold">{tasks.filter((t: any) => t.status === 'IN_PROGRESS').length}</p></div></div></Card>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-red-500" /> Urgente</span>
        <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-amber-500" /> Haute</span>
        <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-blue-500" /> Moyenne</span>
        <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-gray-400" /> Basse</span>
      </div>
    </div>
  );
}
