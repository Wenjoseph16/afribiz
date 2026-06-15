'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, Star, Search, Loader, User, CalendarDays, CheckCircle, Filter, Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useMyEmployees, useEmployeeAttendances } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

export default function EmployeePerformancePage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ employeeId: '', metric: 'PUNCTUALITY', value: 0, comment: '', date: new Date().toISOString().split('T')[0] });
  const [creating, setCreating] = useState(false);

  const { data: employeesData, isLoading: loadingEmployees } = useMyEmployees({ limit: 200 });
  const { data: attendancesData } = useEmployeeAttendances({ limit: 500 });

  const employees: any[] = useMemo(() => {
    const raw = Array.isArray(employeesData) ? employeesData : (employeesData?.employees || employeesData?.data || []);
    return raw;
  }, [employeesData]);

  const attendances: any[] = useMemo(() => {
    const raw = Array.isArray(attendancesData) ? attendancesData : (attendancesData?.attendances || attendancesData?.data || []);
    return raw;
  }, [attendancesData]);

  const filtered = employees.filter((e: any) =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.position?.toLowerCase().includes(search.toLowerCase())
  );

  const employeeStats = useMemo(() => {
    return employees.map((emp: any) => {
      const empAttendances = attendances.filter((a: any) => a.employeeId === emp.id || a.employeeName === emp.name);
      const total = empAttendances.length;
      const present = empAttendances.filter((a: any) => a.status === 'PRESENT').length;
      const late = empAttendances.filter((a: any) => a.status === 'LATE').length;
      const absent = empAttendances.filter((a: any) => a.status === 'ABSENT').length;
      const punctuality = total > 0 ? Math.round(present / total * 100) : 0;
      return { ...emp, totalAttendances: total, presentCount: present, lateCount: late, absentCount: absent, punctuality };
    });
  }, [employees, attendances]);

  const handleCreate = async () => {
    if (!form.employeeId) return;
    setCreating(true);
    try {
      await apiClient.post('/business/employees/performance', {
        employeeId: form.employeeId,
        metric: form.metric,
        value: form.value,
        comment: form.comment,
        date: form.date,
      });
      setShowCreate(false);
      setForm({ employeeId: '', metric: 'PUNCTUALITY', value: 0, comment: '', date: new Date().toISOString().split('T')[0] });
    } catch (err) { console.error(err); }
    setCreating(false);
  };

  if (loadingEmployees) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance employés</h1><p className="text-sm text-gray-500">Analysez la performance et la ponctualité de votre équipe</p></div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1.5" />Ajouter évaluation</Button>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-brand/10"><User className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500">Employés</p><p className="text-lg font-bold">{employees.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-emerald-100"><CheckCircle className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500">Présences</p><p className="text-lg font-bold">{attendances.filter((a: any) => a.status === 'PRESENT').length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-amber-100"><TrendingUp className="w-4 h-4 text-amber-600" /></div><div><p className="text-[10px] text-gray-500">Ponctualité moyenne</p><p className="text-lg font-bold">{employeeStats.length > 0 ? Math.round(employeeStats.reduce((s: number, e: any) => s + e.punctuality, 0) / employeeStats.length) : 0}%</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-red-100"><Search className="w-4 h-4 text-red-600" /></div><div><p className="text-[10px] text-gray-500">Absences</p><p className="text-lg font-bold">{attendances.filter((a: any) => a.status === 'ABSENT').length}</p></div></div></Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Rechercher un employé..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
      </div>

      {/* Employee cards */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12"><User className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucun employé trouvé</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp: any) => {
            const stats = employeeStats.find((e: any) => e.id === emp.id) || { punctuality: 0, totalAttendances: 0, lateCount: 0, absentCount: 0 };
            return (
              <Card key={emp.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center text-sm font-bold text-brand">
                    {(emp.name || '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{emp.name}</p>
                    <p className="text-xs text-gray-500 truncate">{emp.position || emp.role || 'Employé'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
                    <p className="text-lg font-bold text-emerald-600">{stats.punctuality}%</p>
                    <p className="text-[10px] text-gray-500">Ponctualité</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
                    <p className="text-lg font-bold text-amber-600">{stats.lateCount}</p>
                    <p className="text-[10px] text-gray-500">Retards</p>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', stats.punctuality >= 80 ? 'bg-emerald-500' : stats.punctuality >= 60 ? 'bg-amber-500' : 'bg-red-500')}
                    style={{ width: `${stats.punctuality}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>{stats.totalAttendances} présences</span>
                  <span>{stats.absentCount} absences</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Evaluation Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Nouvelle évaluation</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Employé *</label>
                <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
                  <option value="">Sélectionner...</option>
                  {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Métrique</label>
                <select value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
                  <option value="PUNCTUALITY">Ponctualité</option>
                  <option value="QUALITY">Qualité travail</option>
                  <option value="PRODUCTIVITY">Productivité</option>
                  <option value="CLIENT_SATISFACTION">Satisfaction client</option>
                  <option value="TEAMWORK">Esprit d'équipe</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Note (0-100)</label>
                <input type="number" min={0} max={100} value={form.value} onChange={e => setForm(f => ({ ...f, value: parseInt(e.target.value) || 0 }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Commentaire</label>
                <textarea value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} rows={3}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600">Annuler</button>
                <button onClick={handleCreate} disabled={creating || !form.employeeId} className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 disabled:opacity-50">
                  {creating ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
