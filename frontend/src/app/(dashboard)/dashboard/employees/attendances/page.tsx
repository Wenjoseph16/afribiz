'use client';

import { useState, useMemo } from 'react';
import { Clock, Search, Loader, User, CalendarDays, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useEmployeeAttendances } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PRESENT: { label: 'Présent', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle },
  LATE: { label: 'En retard', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', icon: AlertCircle },
  ABSENT: { label: 'Absent', color: 'text-red-600 bg-red-50 dark:bg-red-900/20', icon: XCircle },
  ON_LEAVE: { label: 'En congé', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', icon: Clock },
};

export default function EmployeeAttendancesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showClockIn, setShowClockIn] = useState(false);
  const [clockForm, setClockForm] = useState({ employeeId: '', employeeName: '' });
  const [clocking, setClocking] = useState(false);

  const { data: attendancesData, isLoading, refetch } = useEmployeeAttendances({ limit: 200, sortBy: 'createdAt', order: 'desc' });

  const allAttendances: any[] = useMemo(() => {
    const raw = Array.isArray(attendancesData) ? attendancesData : (attendancesData?.attendances || attendancesData?.data || []);
    return raw;
  }, [attendancesData]);

  const now = new Date();
  const todayStr = now.toDateString();
  const todayAttendances = allAttendances.filter((a: any) => {
    const d = new Date(a.createdAt);
    return d.toDateString() === todayStr;
  });

  const stats = useMemo(() => ({
    total: todayAttendances.length,
    present: todayAttendances.filter((a: any) => a.status === 'PRESENT').length,
    late: todayAttendances.filter((a: any) => a.status === 'LATE').length,
    absent: todayAttendances.filter((a: any) => a.status === 'ABSENT').length,
    onLeave: todayAttendances.filter((a: any) => a.status === 'ON_LEAVE').length,
  }), [todayAttendances]);

  const filtered = useMemo(() => {
    let items = allAttendances;
    if (statusFilter !== 'all') items = items.filter((a: any) => a.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((a: any) =>
        (a.employeeName || '').toLowerCase().includes(q) ||
        (a.employee?.name || '').toLowerCase().includes(q)
      );
    }
    return items;
  }, [allAttendances, statusFilter, search]);

  const handleClockIn = async () => {
    if (!clockForm.employeeId && !clockForm.employeeName) return;
    setClocking(true);
    try {
      await apiClient.post('/business/employees/clock-in', clockForm);
      setShowClockIn(false);
      setClockForm({ employeeId: '', employeeName: '' });
      refetch();
    } catch (err) { console.error(err); }
    setClocking(false);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pointage & Présences</h1><p className="text-sm text-gray-500">Suivez les présences et pointages de vos employés</p></div>
        <button onClick={() => setShowClockIn(true)} className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 transition-colors flex items-center gap-2">
          <Clock className="h-4 w-4" />Pointer
        </button>
      </div>

      {/* Aujourd'hui stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-brand/10"><User className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500">Aujourd'hui</p><p className="text-sm font-bold">{stats.total}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-emerald-100"><CheckCircle className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500">Présents</p><p className="text-sm font-bold">{stats.present}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-amber-100"><AlertCircle className="w-4 h-4 text-amber-600" /></div><div><p className="text-[10px] text-gray-500">Retards</p><p className="text-sm font-bold">{stats.late}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-red-100"><XCircle className="w-4 h-4 text-red-600" /></div><div><p className="text-[10px] text-gray-500">Absents</p><p className="text-sm font-bold">{stats.absent}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-blue-100"><Clock className="w-4 h-4 text-blue-600" /></div><div><p className="text-[10px] text-gray-500">Congés</p><p className="text-sm font-bold">{stats.onLeave}</p></div></div></Card>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="flex gap-1 overflow-x-auto">
          {[{ key: 'all', label: 'Tous' }, { key: 'PRESENT', label: 'Présents' }, { key: 'LATE', label: 'Retards' }, { key: 'ABSENT', label: 'Absents' }, { key: 'ON_LEAVE', label: 'Congés' }].map(tab => (
            <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                statusFilter === tab.key ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>{tab.label}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher un employé..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {/* Attendance list */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12"><Clock className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">{search ? 'Aucun résultat' : "Aucun pointage pour l'instant"}</p></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((att: any) => {
            const sc = STATUS_CONFIG[att.status] || STATUS_CONFIG.PRESENT;
            const StatusIcon = sc.icon;
            const clockIn = att.clockIn ? new Date(att.clockIn) : null;
            const clockOut = att.clockOut ? new Date(att.clockOut) : null;
            return (
              <Card key={att.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg', sc.color.replace('text-', '').split(' ')[1] ? `bg-${sc.color.split(' ')[1]}` : 'bg-gray-100')}>
                      <StatusIcon className={cn('w-5 h-5', sc.color.split(' ')[0])} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{att.employeeName || att.employee?.name || 'Employé'}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <CalendarDays className="w-3 h-3" />{clockIn ? clockIn.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        <Clock className="w-3 h-3 ml-1" />{clockIn ? clockIn.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        {clockOut && <span>→ {clockOut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                      </p>
                    </div>
                  </div>
                  <Badge variant={att.status === 'PRESENT' ? 'success' : att.status === 'LATE' ? 'warning' : att.status === 'ABSENT' ? 'danger' : 'info'} size="xs">
                    {sc.label}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Clock In Modal */}
      {showClockIn && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowClockIn(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Pointer un employé</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom de l'employé *</label>
                <input type="text" value={clockForm.employeeName} onChange={e => setClockForm(f => ({ ...f, employeeName: e.target.value }))} required
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" placeholder="Entrez le nom" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">ID employé (optionnel)</label>
                <input type="text" value={clockForm.employeeId} onChange={e => setClockForm(f => ({ ...f, employeeId: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" placeholder="ID employé" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowClockIn(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600">Annuler</button>
                <button onClick={handleClockIn} disabled={clocking || !clockForm.employeeName} className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 disabled:opacity-50">
                  {clocking ? 'Pointage...' : 'Pointer arrivée'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
