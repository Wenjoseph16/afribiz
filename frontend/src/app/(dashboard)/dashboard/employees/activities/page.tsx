'use client';

import { useState, useMemo, useEffect } from 'react';
import { Activity, Search, Loader, User, Clock, CalendarDays, Filter, Shield, ShoppingBag, FileText, Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useMyEmployees } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

const ACTION_ICONS: Record<string, any> = {
  LOGIN: User, LOGOUT: User, CLOCK_IN: Clock, CLOCK_OUT: Clock,
  CREATE: ShoppingBag, UPDATE: FileText, DELETE: FileText,
  ASSIGN: User, COMPLETE: Activity, CANCEL: Activity,
  VIEW: FileText, EXPORT: Activity, SETTINGS: Settings,
};
const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  LOGOUT: 'text-gray-500 bg-gray-100 dark:bg-gray-800',
  CLOCK_IN: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  CLOCK_OUT: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  CREATE: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  UPDATE: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  DELETE: 'text-red-600 bg-red-50 dark:bg-red-900/20',
};

export default function EmployeeActivitiesPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: employeesData } = useMyEmployees({ limit: 500 });

  const employees: any[] = useMemo(() => {
    const raw = Array.isArray(employeesData) ? employeesData : (employeesData?.employees || employeesData?.data || []);
    return raw;
  }, [employeesData]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/business/employees/activities', { params: { limit: 200, order: 'desc' } });
        const data = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.activities || res.data.data?.logs || []);
        setLogs(data);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, []);

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map((l: any) => l.action));
    return Array.from(actions);
  }, [logs]);

  const filtered = logs.filter((log: any) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const emp = employees.find((e: any) => e.id === log.employeeId);
      return (emp?.name || '').toLowerCase().includes(q) || (log.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activités employés</h1>
        <p className="text-sm text-gray-500">Historique des actions et activités de votre équipe</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-brand/10"><Activity className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500">Total activités</p><p className="text-lg font-bold">{logs.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-blue-100"><User className="w-4 h-4 text-blue-600" /></div><div><p className="text-[10px] text-gray-500">Employés actifs</p><p className="text-lg font-bold">{new Set(logs.map((l: any) => l.employeeId).filter(Boolean)).size}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-amber-100"><Filter className="w-4 h-4 text-amber-600" /></div><div><p className="text-[10px] text-gray-500">Types actions</p><p className="text-lg font-bold">{uniqueActions.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-emerald-100"><CalendarDays className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500">Aujourd'hui</p><p className="text-lg font-bold">{logs.filter((l: any) => new Date(l.createdAt).toDateString() === new Date().toDateString()).length}</p></div></div></Card>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="flex gap-1 overflow-x-auto">
          <button onClick={() => setActionFilter('all')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
              actionFilter === 'all' ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700')}>Toutes</button>
          {uniqueActions.slice(0, 10).map((action: any) => (
            <button key={action} onClick={() => setActionFilter(action)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                actionFilter === action ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700')}>{action}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par employé ou description..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12"><Activity className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucune activité trouvée</p></Card>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-3">
            {filtered.map((log: any) => {
              const Icon = ACTION_ICONS[log.action] || Activity;
              const colorClass = ACTION_COLORS[log.action] || 'text-gray-500 bg-gray-100';
              const emp = employees.find((e: any) => e.id === log.employeeId);
              return (
                <div key={log.id} className="relative flex items-start gap-4 pl-0">
                  <div className={cn('p-2 rounded-xl z-10', colorClass)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {emp?.name || log.employeeName || 'Employé'}
                        <span className="text-gray-500 font-normal"> — {log.description || log.action}</span>
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <CalendarDays className="w-3 h-3" />
                      {log.createdAt ? new Date(log.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      {log.module && <Badge variant="info" size="xs">{log.module}</Badge>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
