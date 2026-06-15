'use client';

import { useState } from 'react';
import {
  Activity, Search, ChevronLeft, ChevronRight, RefreshCw,
  Shield, CheckCircle, XCircle, AlertTriangle, Filter,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const MODULES = [
  'Tous', 'Auth', 'Utilisateurs', 'Business', 'Paiements', 'Marketplace',
  'DataHub', 'Publicités', 'Support', 'Sécurité', 'Notifications',
];

const ACTION_TYPES = [
  'Tous', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE',
  'REJECT', 'SUSPEND', 'ACTIVATE', 'BLOCK', 'UNBLOCK',
];

const STATUS_STYLES: Record<string, string> = {
  SUCCESS: 'text-emerald-600',
  ERROR: 'text-red-600',
  WARNING: 'text-amber-600',
};

export default function AdminLogsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [module, setModule] = useState('Tous');
  const [actionType, setActionType] = useState('Tous');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const limit = 25;

  const params: any = { page, limit };
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  if (module !== 'Tous') params.module = module;
  if (actionType !== 'Tous') params.action = actionType;
  if (search) params.search = search;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'logs', params, autoRefresh],
    queryFn: async () => {
      const res = await apiClient.get('/admin/logs', { params });
      return res.data.data || { logs: [], totalPages: 1 };
    },
    enabled: isAdmin,
    refetchInterval: autoRefresh ? 15000 : false,
  });

  const logs = Array.isArray(data) ? data : data?.logs ?? [];
  const totalPages = data?.totalPages ?? 1;

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setModule('Tous');
    setActionType('Tous');
    setSearch('');
    setPage(1);
  };

  const hasFilters = dateFrom || dateTo || module !== 'Tous' || actionType !== 'Tous' || search;

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Logs système</h1>
        <EmptyState icon={<Shield className="h-8 w-8" />} title="Accès réservé" description="Vous devez être administrateur pour accéder à cette page." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Logs système</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Historique des actions administrateurs et système</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={autoRefresh}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoRefresh ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoRefresh ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">Auto-refresh</span>
          </label>
        </div>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Du</label>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Au</label>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Module</label>
            <select value={module} onChange={(e) => { setModule(e.target.value); setPage(1); }} className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
              {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Action</label>
            <select value={actionType} onChange={(e) => { setActionType(e.target.value); setPage(1); }} className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
              {ACTION_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setPage(1)} className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <Filter className="h-4 w-4" /> Effacer
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Heure</th>
                  <th className="p-4 font-medium">Utilisateur</th>
                  <th className="p-4 font-medium">Admin</th>
                  <th className="p-4 font-medium">Action</th>
                  <th className="p-4 font-medium">Module</th>
                  <th className="p-4 font-medium">IP</th>
                  <th className="p-4 font-medium">Résultat</th>
                  <th className="p-4 font-medium">Détails</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => {
                  const d = log.createdAt || log.date ? new Date(log.createdAt || log.date) : null;
                  return (
                    <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4 text-xs text-gray-900 dark:text-gray-100">{d ? d.toLocaleDateString('fr-FR') : '-'}</td>
                      <td className="p-4 text-xs text-gray-500">{d ? d.toLocaleTimeString('fr-FR') : '-'}</td>
                      <td className="p-4 text-gray-500">{log.user?.name || log.user?.email || log.userId?.slice(0, 8) || '-'}</td>
                      <td className="p-4 text-gray-500">{log.admin?.name || log.admin?.email || log.adminId?.slice(0, 8) || '-'}</td>
                      <td className="p-4">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{log.action || '-'}</span>
                      </td>
                      <td className="p-4 text-xs text-gray-500">{log.module || '-'}</td>
                      <td className="p-4 text-xs text-gray-500">{log.ip || '-'}</td>
                      <td className="p-4">
                        <span className={`text-xs font-medium flex items-center gap-1 ${STATUS_STYLES[log.status] || 'text-gray-500'}`}>
                          {log.status === 'SUCCESS' && <CheckCircle className="h-3 w-3" />}
                          {log.status === 'ERROR' && <XCircle className="h-3 w-3" />}
                          {log.status === 'WARNING' && <AlertTriangle className="h-3 w-3" />}
                          {log.status || '-'}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-400 max-w-[200px] truncate">{log.details || log.description || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Activity className="h-8 w-8" />} title="Aucun log" description={hasFilters ? 'Aucun log ne correspond aux filtres.' : 'Aucun log système trouvé.'} />
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} sur {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
