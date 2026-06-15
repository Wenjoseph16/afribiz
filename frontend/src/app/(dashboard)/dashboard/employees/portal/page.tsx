'use client';

import { useState, useMemo } from 'react';
import { User, Clock, CalendarDays, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import { usePlanningTasks, useEmployeeAttendances } from '@/features/hooks';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'À faire', color: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
  IN_PROGRESS: { label: 'En cours', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  COMPLETED: { label: 'Terminé', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  CANCELLED: { label: 'Annulé', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
};

export default function EmployeePortalPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'schedule' | 'profile'>('tasks');
  const [employeeName, setEmployeeName] = useState(() => localStorage.getItem('portal_employee_name') || '');
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState<string | null>(null);

  const { data: tasksData } = usePlanningTasks({ limit: 50, assignee: employeeName });
  const { data: attendancesData } = useEmployeeAttendances({ limit: 50 });

  const tasks: any[] = useMemo(() => {
    const raw = Array.isArray(tasksData) ? tasksData : (tasksData?.tasks || tasksData?.data || []);
    return raw.filter((t: any) => !employeeName || t.assignee?.toLowerCase() === employeeName.toLowerCase());
  }, [tasksData, employeeName]);

  const myAttendances = useMemo(() => {
    const raw = Array.isArray(attendancesData) ? attendancesData : (attendancesData?.attendances || attendancesData?.data || []);
    return raw.filter((a: any) => a.employeeName?.toLowerCase() === employeeName.toLowerCase());
  }, [attendancesData, employeeName]);

  const pendingTasks = tasks.filter((t: any) => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED');
  const overdueTasks = tasks.filter((t: any) =>
    t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && t.dueDate && new Date(t.dueDate) < new Date()
  );
  const lastAttendance = myAttendances[myAttendances.length - 1];

  const handleClockIn = async () => {
    try {
      await apiClient.post('/business/employees/clock-in', { employeeName });
      setClockedIn(true);
      setClockTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) { console.error(err); }
  };

  const handleClockOut = async () => {
    try {
      if (lastAttendance?.id) await apiClient.clockOut(lastAttendance.id);
      setClockedIn(false);
      setClockTime(null);
    } catch (err) { console.error(err); }
  };

  if (!employeeName) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Portail employé</h1>
          <p className="text-sm text-gray-500 mb-6">Entrez votre nom pour accéder à votre espace</p>
          <input type="text" value={employeeName}
            onChange={e => { setEmployeeName(e.target.value); localStorage.setItem('portal_employee_name', e.target.value); }}
            placeholder="Votre nom"
            className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 mb-3 text-center" />
          <Button className="w-full" onClick={() => {}} disabled={!employeeName}>Accéder</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center text-lg font-bold text-brand">
            {employeeName[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bonjour, {employeeName} 👋</h1>
            <p className="text-sm text-gray-500">Votre espace personnel</p>
          </div>
        </div>
        <button onClick={() => { setEmployeeName(''); localStorage.removeItem('portal_employee_name'); }}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* RH Notifications */}
      {(overdueTasks.length > 0 || pendingTasks.length > 3) && (
        <div className="space-y-2">
          {overdueTasks.length > 0 && (
            <Card className="p-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">⚠️ {overdueTasks.length} tâche(s) en retard</p>
                  <p className="text-xs text-red-600 dark:text-red-400">Vous avez des tâches qui dépassent leur échéance. Veuillez les traiter rapidement.</p>
                </div>
              </div>
            </Card>
          )}
          {pendingTasks.length > 3 && (
            <Card className="p-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">⏰ {pendingTasks.length} tâches en attente</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Vous accumulez des tâches non terminées. Priorisez les plus urgentes.</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {([
          { key: 'tasks', label: 'Tâches', icon: CheckCircle },
          { key: 'schedule', label: 'Planning', icon: CalendarDays },
          { key: 'profile', label: 'Profil', icon: User },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.key ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <button onClick={clockedIn ? handleClockOut : handleClockIn}
            className={cn('w-full flex items-center gap-2', clockedIn ? 'text-red-600' : 'text-emerald-600')}>
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">{clockedIn ? 'Pointer sortie' : 'Pointer arrivée'}</span>
          </button>
          {clockTime && <p className="text-[10px] text-gray-400 mt-1">Pointé à {clockTime}</p>}
        </Card>
        <Card className="p-3"><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /><div><p className="text-[10px] text-gray-500">Terminées</p><p className="text-sm font-bold">{completedTasks.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" /><div><p className="text-[10px] text-gray-500">En cours</p><p className="text-sm font-bold">{pendingTasks.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-600" /><div><p className="text-[10px] text-gray-500">En retard</p><p className="text-sm font-bold">{overdueTasks.length}</p></div></div></Card>
      </div>

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><CheckCircle className="w-4 h-4" />Mes tâches</h2>
          {tasks.length === 0 ? (
            <Card className="text-center py-8"><CheckCircle className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" /><p className="text-xs text-gray-500">Aucune tâche assignée</p></Card>
          ) : (
            tasks.slice(0, 10).map((t: any) => {
              const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING;
              const isOverdue = t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && t.dueDate && new Date(t.dueDate) < new Date();
              return (
                <Card key={t.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-2 h-2 rounded-full', t.priority === 'URGENT' ? 'bg-red-500' : t.priority === 'HIGH' ? 'bg-amber-500' : t.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-gray-400')} />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t.title}</p>
                        <p className="text-xs text-gray-500">{t.description?.slice(0, 80) || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOverdue && <Badge variant="danger" size="xs">Retard</Badge>}
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full', sc.color)}>{sc.label}</span>
                    </div>
                  </div>
                  {t.dueDate && (
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />Échéance : {new Date(t.dueDate).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Schedule tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><CalendarDays className="w-4 h-4" />Mes pointages</h2>
          {myAttendances.length === 0 ? (
            <Card className="text-center py-8"><Clock className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" /><p className="text-xs text-gray-500">Aucun pointage</p></Card>
          ) : (
            <div className="space-y-2">
              {myAttendances.slice(0, 15).map((a: any) => (
                <Card key={a.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-1.5 rounded-lg', a.status === 'PRESENT' ? 'bg-emerald-50' : a.status === 'LATE' ? 'bg-amber-50' : 'bg-red-50')}>
                        {a.status === 'PRESENT' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> :
                         a.status === 'LATE' ? <AlertCircle className="w-4 h-4 text-amber-600" /> :
                         <AlertCircle className="w-4 h-4 text-red-600" />}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          {' — '}{a.clockIn ? new Date(a.clockIn).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          {a.clockOut && ` → ${new Date(a.clockOut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={a.status === 'PRESENT' ? 'success' : a.status === 'LATE' ? 'warning' : 'danger'} size="xs">
                      {a.status === 'PRESENT' ? 'Présent' : a.status === 'LATE' ? 'Retard' : 'Absent'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center text-2xl font-bold text-brand">
              {employeeName[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{employeeName}</h2>
              <p className="text-sm text-gray-500">Employé</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Tâches complétées</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{completedTasks.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Taux complétion</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {tasks.length > 0 ? Math.round(completedTasks.length / tasks.length * 100) : 0}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Pointages</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{myAttendances.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Notifications</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {overdueTasks.length > 0 ? overdueTasks.length : 0}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
