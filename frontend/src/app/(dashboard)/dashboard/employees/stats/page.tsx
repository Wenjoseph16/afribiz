'use client';

import { useMemo } from 'react';
import { Users, TrendingUp, Clock, CalendarDays, CheckCircle, Loader, Target, Award, AlertCircle, Bell } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useEmployeeStats, useMyEmployees, useEmployeeAttendances } from '@/features/hooks';

export default function EmployeeStatsPage() {
  const { data: statsData, isLoading } = useEmployeeStats();
  const { data: employeesData } = useMyEmployees({ limit: 500 });
  const { data: attendancesData } = useEmployeeAttendances({ limit: 500 });

  const employees: any[] = useMemo(() => {
    const raw = Array.isArray(employeesData) ? employeesData : (employeesData?.employees || employeesData?.data || []);
    return raw;
  }, [employeesData]);

  const attendances: any[] = useMemo(() => {
    const raw = Array.isArray(attendancesData) ? attendancesData : (attendancesData?.attendances || attendancesData?.data || []);
    return raw;
  }, [attendancesData]);

  const stats = (statsData?.data || statsData) as any || {};

  const activeEmployees = employees.filter((e: any) => e.status === 'ACTIVE' || e.status === 'ACTIF' || !e.status);
  const totalAttendances = attendances.length;
  const presentCount = attendances.filter((a: any) => a.status === 'PRESENT').length;
  const lateCount = attendances.filter((a: any) => a.status === 'LATE').length;
  const absentCount = attendances.filter((a: any) => a.status === 'ABSENT').length;
  const punctualityRate = totalAttendances > 0 ? Math.round(presentCount / totalAttendances * 100) : 0;

  const kpis = [
    { label: 'Employés actifs', value: activeEmployees.length, color: 'bg-brand', icon: Users },
    { label: 'Taux ponctualité', value: `${punctualityRate}%`, color: punctualityRate >= 80 ? 'bg-emerald-500' : punctualityRate >= 60 ? 'bg-amber-500' : 'bg-red-500', icon: Target },
    { label: 'Total présences', value: totalAttendances, color: 'bg-blue-500', icon: Clock },
    { label: 'Employés par jour', value: employees.length > 0 ? Math.round(totalAttendances / Math.max(1, new Set(attendances.map((a: any) => new Date(a.createdAt).toDateString())).size)) : 0, color: 'bg-purple-500', icon: CalendarDays },
  ];

  const todayAttendances = attendances.filter((a: any) => {
    const d = new Date(a.createdAt);
    return d.toDateString() === new Date().toDateString();
  });
  const todayLate = todayAttendances.filter((a: any) => a.status === 'LATE');
  const todayAbsent = todayAttendances.filter((a: any) => a.status === 'ABSENT');
  const employeesWithLowPunctuality = employees.filter((e: any) => {
    const empAtt = attendances.filter((a: any) => a.employeeId === e.id || a.employeeName === e.name);
    const empPresent = empAtt.filter((a: any) => a.status === 'PRESENT').length;
    const rate = empAtt.length > 0 ? empPresent / empAtt.length : 1;
    return rate < 0.5 && empAtt.length >= 3;
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      {/* RH Alert Notifications */}
      {(todayLate.length > 0 || todayAbsent.length > 0 || employeesWithLowPunctuality.length > 0) && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Bell className="w-4 h-4" />Alertes RH du jour</h2>
          {todayLate.length > 0 && (
            <Card className="p-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">⏰ {todayLate.length} employé(s) en retard aujourd'hui</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {todayLate.slice(0, 3).map((a: any) => a.employeeName || a.employee?.name).filter(Boolean).join(', ')}
                    {todayLate.length > 3 && ` et ${todayLate.length - 3} autre(s)`}
                  </p>
                </div>
              </div>
            </Card>
          )}
          {todayAbsent.length > 0 && (
            <Card className="p-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">🚫 {todayAbsent.length} absence(s) aujourd'hui</p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {todayAbsent.slice(0, 3).map((a: any) => a.employeeName || a.employee?.name).filter(Boolean).join(', ')}
                    {todayAbsent.length > 3 && ` et ${todayAbsent.length - 3} autre(s)`}
                  </p>
                </div>
              </div>
            </Card>
          )}
          {employeesWithLowPunctuality.length > 0 && (
            <Card className="p-3 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">📉 {employeesWithLowPunctuality.length} employé(s) avec faible ponctualité</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    {employeesWithLowPunctuality.slice(0, 3).map((e: any) => e.name).filter(Boolean).join(', ')}
                    {employeesWithLowPunctuality.length > 3 && ` et ${employeesWithLowPunctuality.length - 3} autre(s)`}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistiques RH</h1>
        <p className="text-sm text-gray-500">Analysez la performance et la gestion de vos ressources humaines</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', kpi.color === 'bg-brand' ? 'bg-brand/10' : `${kpi.color.replace('bg-', 'bg-').replace('bg-', 'bg-')} bg-opacity-10`, 'flex items-center')}>
                  <Icon className={cn('w-4 h-4', kpi.color === 'bg-brand' ? 'text-brand' : kpi.color.replace('bg-', 'text-'))} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">{kpi.label}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee status distribution */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Users className="w-4 h-4" />Répartition des employés</h3>
          <div className="space-y-3">
            {[
              { label: 'Actifs', count: activeEmployees.length, color: 'bg-emerald-500' },
              { label: 'Suspendus', count: employees.filter((e: any) => e.status === 'SUSPENDED').length, color: 'bg-red-500' },
              { label: 'En congé', count: employees.filter((e: any) => e.status === 'ON_LEAVE' || e.status === 'CONGE').length, color: 'bg-amber-500' },
              { label: 'Inactifs', count: employees.filter((e: any) => e.status === 'INACTIVE').length, color: 'bg-gray-400' },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{s.label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{s.count} ({employees.length > 0 ? Math.round(s.count / employees.length * 100) : 0}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', s.color)} style={{ width: `${employees.length > 0 ? (s.count / employees.length * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Attendance stats */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4" />Statistiques présence</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-center">
              <p className="text-3xl font-bold text-emerald-600">{presentCount}</p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300">Présents</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-center">
              <p className="text-3xl font-bold text-amber-600">{lateCount}</p>
              <p className="text-[10px] text-amber-700 dark:text-amber-300">Retards</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-center">
              <p className="text-3xl font-bold text-red-600">{absentCount}</p>
              <p className="text-[10px] text-red-700 dark:text-red-300">Absences</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
              <p className="text-3xl font-bold text-blue-600">{totalAttendances}</p>
              <p className="text-[10px] text-blue-700 dark:text-blue-300">Total</p>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
            {totalAttendances > 0 && (
              <>
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${presentCount / totalAttendances * 100}%` }} />
                <div className="h-full bg-amber-500 transition-all" style={{ width: `${lateCount / totalAttendances * 100}%` }} />
                <div className="h-full bg-red-500 transition-all" style={{ width: `${absentCount / totalAttendances * 100}%` }} />
              </>
            )}
          </div>
        </Card>

        {/* Plus performants */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Award className="w-4 h-4" />Top ponctualité</h3>
          {employees.slice(0, 5).map((emp: any, i: number) => {
            const empAtt = attendances.filter((a: any) => a.employeeId === emp.id || a.employeeName === emp.name);
            const empPresent = empAtt.filter((a: any) => a.status === 'PRESENT').length;
            const rate = empAtt.length > 0 ? Math.round(empPresent / empAtt.length * 100) : 0;
            return (
              <div key={emp.id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white',
                  i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-300 dark:bg-gray-600'
                )}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{emp.name}</p>
                  <p className="text-[10px] text-gray-500">{emp.position || 'Employé'}</p>
                </div>
                <div className="text-right">
                  <p className={cn('text-xs font-bold', rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600')}>{rate}%</p>
                </div>
              </div>
            );
          })}
        </Card>

        {/* Recommendations */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/30">
          <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Suggestions RH</h3>
          <div className="space-y-2">
            {absentCount > totalAttendances * 0.2 && (
              <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-300">⚠️ Taux d'absence élevé</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">Les absences représentent {totalAttendances > 0 ? Math.round(absentCount / totalAttendances * 100) : 0}% des pointages.</p>
              </div>
            )}
            {lateCount > 0 && (
              <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-300">⏰ Gestion des retards</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">{lateCount} retards enregistrés. Envisagez un rappel automatique aux employés concernés.</p>
              </div>
            )}
            <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">📊 Productivité</p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">{employees.length} employés pour {totalAttendances} présences enregistrées.</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEmployees ?? employees.length}</p>
          <p className="text-[10px] text-gray-500">Total employés</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{new Set(attendances.map((a: any) => new Date(a.createdAt).toDateString())).size}</p>
          <p className="text-[10px] text-gray-500">Jours pointés</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{new Set(employees.map((e: any) => e.department).filter(Boolean)).size}</p>
          <p className="text-[10px] text-gray-500">Départements</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageTenure ? `${stats.averageTenure}m` : '—'}</p>
          <p className="text-[10px] text-gray-500">Ancienneté moyenne</p>
        </div>
      </div>
    </div>
  );
}
